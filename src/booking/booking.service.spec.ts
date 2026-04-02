import { Test } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AirworthinessStatus, Role } from '@prisma/client';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPublish = jest.fn().mockResolvedValue(undefined);

const mockPubSub = {
  publish: mockPublish,
};

const mockPrisma = {
  aircraft: { findUnique: jest.fn() },
  base: { findUnique: jest.fn() },
  booking: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

const userId = 'user-1';
const organizationId = 'org-1';
const aircraftId = 'aircraft-1';
const baseId = 'base-1';

const baseInput = {
  baseId,
  aircraftId,
  startTime: new Date('2026-06-01T10:00:00Z'),
  endTime: new Date('2026-06-01T12:00:00Z'),
};

describe('BookingService', () => {
  let service: BookingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'PUB_SUB', useValue: mockPubSub },
      ],
    }).compile();
    service = module.get(BookingService);
  });

  describe('createBooking', () => {
    it('throws BadRequestException when aircraft not found', async () => {
      mockPrisma.aircraft.findUnique.mockResolvedValue(null);

      await expect(
        service.createBooking(userId, organizationId, baseInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when aircraft is not in user organization', async () => {
      mockPrisma.aircraft.findUnique.mockResolvedValue({
        id: aircraftId,
        organizationId: 'other-org',
        tailNumber: 'N12345',
        airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
      });

      await expect(
        service.createBooking(userId, organizationId, baseInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when aircraft is GROUNDED', async () => {
      mockPrisma.aircraft.findUnique.mockResolvedValue({
        id: aircraftId,
        organizationId,
        tailNumber: 'N12345',
        airworthinessStatus: AirworthinessStatus.GROUNDED,
      });

      await expect(
        service.createBooking(userId, organizationId, baseInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when time block overlaps', async () => {
      mockPrisma.aircraft.findUnique.mockResolvedValue({
        id: aircraftId,
        organizationId,
        airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
      });
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'existing-booking',
        startTime: new Date('2026-06-01T09:00:00Z'),
        endTime: new Date('2026-06-01T11:00:00Z'),
      });

      await expect(
        service.createBooking(userId, organizationId, baseInput),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when base is not in user organization', async () => {
      mockPrisma.aircraft.findUnique.mockResolvedValue({
        id: aircraftId,
        organizationId,
        airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.base.findUnique.mockResolvedValue({
        id: baseId,
        organizationId: 'other-org',
      });

      await expect(
        service.createBooking(userId, organizationId, baseInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a booking when all checks pass', async () => {
      mockPrisma.aircraft.findUnique.mockResolvedValue({
        id: aircraftId,
        organizationId,
        airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.base.findUnique.mockResolvedValue({
        id: baseId,
        organizationId,
      });
      const created = {
        id: 'booking-1',
        userId,
        aircraftId,
        baseId,
        base: { organizationId },
      };
      mockPrisma.booking.create.mockResolvedValue(created);

      const result = await service.createBooking(
        userId,
        organizationId,
        baseInput,
      );

      expect(result).toEqual(created);
      expect(mockPrisma.booking.create).toHaveBeenCalledWith({
        data: {
          userId,
          aircraftId,
          baseId,
          startTime: expect.any(Date),
          endTime: expect.any(Date),
        },
        include: { user: true, aircraft: true, base: true },
      });
      expect(mockPublish).toHaveBeenCalledWith('bookingUpdated', {
        bookingUpdated: { ...created, organizationId },
      });
    });
  });

  describe('findAll', () => {
    it('filters by organizationId', async () => {
      const bookings = [{ id: '1' }];
      mockPrisma.booking.findMany.mockResolvedValue(bookings);

      expect(await service.findAll(organizationId)).toEqual(bookings);
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { base: { organizationId } },
        include: { user: true, aircraft: true, base: true },
        orderBy: { startTime: 'asc' },
      });
    });

    it('filters by organizationId and optional baseId', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);

      await service.findAll(organizationId, baseId);

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { base: { organizationId }, baseId },
        include: { user: true, aircraft: true, base: true },
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('findByBase', () => {
    it('returns only bookings at that base', async () => {
      const rows = [{ id: 'b1', baseId }];
      mockPrisma.booking.findMany.mockResolvedValue(rows);

      const result = await service.findByBase(organizationId, baseId);

      expect(result).toEqual(rows);
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { baseId, base: { organizationId } },
        include: { user: true, aircraft: true, base: true },
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('findByAircraft', () => {
    it('returns bookings for aircraft across bases in the org', async () => {
      const rows = [
        { id: 'b1', aircraftId, baseId: 'base-a' },
        { id: 'b2', aircraftId, baseId: 'base-b' },
      ];
      mockPrisma.booking.findMany.mockResolvedValue(rows);

      const result = await service.findByAircraft(organizationId, aircraftId);

      expect(result).toEqual(rows);
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { aircraftId, base: { organizationId } },
        include: { user: true, aircraft: true, base: true },
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('myBookings', () => {
    it('filters by userId and organizationId', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);

      await service.myBookings(userId, organizationId);

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { userId, base: { organizationId } },
        include: { user: true, aircraft: true, base: true },
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('cancelBooking', () => {
    it('allows the booking owner to cancel', async () => {
      const booking = {
        id: 'booking-1',
        userId,
        base: { organizationId },
        user: {},
        aircraft: {},
      };
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(
        service.cancelBooking(
          'booking-1',
          userId,
          Role.STUDENT,
          organizationId,
        ),
      ).resolves.toBe(true);

      expect(mockPrisma.booking.delete).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
      });
      expect(mockPublish).toHaveBeenCalledWith('bookingUpdated', {
        bookingUpdated: { ...booking, organizationId },
      });
    });

    it('allows DISPATCHER to cancel any booking in their org', async () => {
      const booking = {
        id: 'booking-1',
        userId: 'other-user',
        base: { organizationId },
        user: {},
        aircraft: {},
      };
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(
        service.cancelBooking(
          'booking-1',
          userId,
          Role.DISPATCHER,
          organizationId,
        ),
      ).resolves.toBe(true);

      expect(mockPrisma.booking.delete).toHaveBeenCalled();
    });

    it('rejects non-owner non-dispatcher', async () => {
      const booking = {
        id: 'booking-1',
        userId: 'other-user',
        base: { organizationId },
        user: {},
        aircraft: {},
      };
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(
        service.cancelBooking(
          'booking-1',
          userId,
          Role.STUDENT,
          organizationId,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.booking.delete).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns a booking by id', async () => {
      const booking = { id: 'b-1' };
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      expect(await service.findById('b-1')).toEqual(booking);
      expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        include: { user: true, aircraft: true, base: true },
      });
    });
  });
});
