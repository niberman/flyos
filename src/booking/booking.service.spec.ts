import { Test } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  AirworthinessStatus,
  BookingStatus,
  Role,
  SchedulableResourceKind,
} from '@prisma/client';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { PilotComplianceService } from '../pilot-compliance/pilot-compliance.service';

const mockPublish = jest.fn().mockResolvedValue(undefined);

const mockPubSub = {
  publish: mockPublish,
};

const mockCompliance = {
  assertEligibleForBooking: jest.fn().mockResolvedValue(undefined),
};

const mockPrisma = {
  schedulableResource: { findFirst: jest.fn() },
  base: { findUnique: jest.fn() },
  booking: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: { findFirst: jest.fn() },
  aircraft: { update: jest.fn() },
  $transaction: jest.fn(),
};

const userId = 'user-1';
const organizationId = 'org-1';
const aircraftId = 'aircraft-1';
const resourceId = 'sr-1';
const baseId = 'base-1';

const resourceAircraft = {
  id: resourceId,
  organizationId,
  kind: SchedulableResourceKind.AIRCRAFT,
  isActive: true,
  aircraftId,
  aircraft: {
    id: aircraftId,
    tailNumber: 'N12345',
    airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
  },
};

const baseInput = {
  baseId,
  aircraftId,
  startTime: new Date('2026-06-01T10:00:00Z'),
  endTime: new Date('2026-06-01T12:00:00Z'),
};

const bookingInclude = {
  user: true,
  base: true,
  schedulableResource: { include: { aircraft: true } },
  participants: { include: { user: true } },
};

describe('BookingService', () => {
  let service: BookingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PilotComplianceService, useValue: mockCompliance },
        { provide: 'PUB_SUB', useValue: mockPubSub },
      ],
    }).compile();
    service = module.get(BookingService);
  });

  describe('createBooking', () => {
    it('throws when schedulable resource missing for aircraft', async () => {
      mockPrisma.schedulableResource.findFirst.mockResolvedValue(null);

      await expect(
        service.createBooking(userId, organizationId, baseInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when aircraft is GROUNDED', async () => {
      mockPrisma.schedulableResource.findFirst.mockResolvedValue({
        ...resourceAircraft,
        aircraft: {
          ...resourceAircraft.aircraft,
          airworthinessStatus: AirworthinessStatus.GROUNDED,
        },
      });

      await expect(
        service.createBooking(userId, organizationId, baseInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when time block overlaps', async () => {
      mockPrisma.schedulableResource.findFirst.mockResolvedValue(
        resourceAircraft,
      );
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'existing-booking',
        startTime: new Date('2026-06-01T09:00:00Z'),
        endTime: new Date('2026-06-01T11:00:00Z'),
      });

      await expect(
        service.createBooking(userId, organizationId, baseInput),
      ).rejects.toThrow(ConflictException);
    });

    it('throws when base is not in organization', async () => {
      mockPrisma.schedulableResource.findFirst.mockResolvedValue(
        resourceAircraft,
      );
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.base.findUnique.mockResolvedValue({
        id: baseId,
        organizationId: 'other-org',
      });

      await expect(
        service.createBooking(userId, organizationId, baseInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates booking via transaction when all checks pass', async () => {
      mockPrisma.schedulableResource.findFirst.mockResolvedValue(
        resourceAircraft,
      );
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.base.findUnique.mockResolvedValue({
        id: baseId,
        organizationId,
      });

      const created = {
        id: 'booking-1',
        userId,
        schedulableResourceId: resourceId,
        baseId,
        base: { organizationId },
        schedulableResource: resourceAircraft,
      };

      mockPrisma.$transaction.mockImplementation(
        async (
          fn: (tx: { booking: { create: jest.Mock } }) => Promise<unknown>,
        ) => {
          const tx = {
            booking: {
              create: jest.fn().mockResolvedValue(created),
            },
          };
          return fn(tx);
        },
      );

      const result = await service.createBooking(
        userId,
        organizationId,
        baseInput,
      );

      expect(result).toEqual(created);
      expect(mockCompliance.assertEligibleForBooking).toHaveBeenCalled();
      expect(mockPublish).toHaveBeenCalledWith('bookingUpdated', {
        bookingUpdated: { ...created, organizationId },
      });
    });
  });

  describe('findAll', () => {
    it('filters cancelled out and by organizationId', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);

      await service.findAll(organizationId);

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          base: { organizationId },
          status: { not: BookingStatus.CANCELLED },
        },
        include: bookingInclude,
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('findByAircraft', () => {
    it('resolves resource then lists bookings', async () => {
      mockPrisma.schedulableResource.findFirst.mockResolvedValue({
        id: resourceId,
      });
      mockPrisma.booking.findMany.mockResolvedValue([]);

      await service.findByAircraft(organizationId, aircraftId);

      expect(mockPrisma.schedulableResource.findFirst).toHaveBeenCalledWith({
        where: { aircraftId, organizationId },
      });
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          schedulableResourceId: resourceId,
          base: { organizationId },
          status: { not: BookingStatus.CANCELLED },
        },
        include: bookingInclude,
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('myBookings', () => {
    it('includes participant rows', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);

      await service.myBookings(userId, organizationId);

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          base: { organizationId },
          status: { not: BookingStatus.CANCELLED },
          OR: [{ userId }, { participants: { some: { userId } } }],
        },
        include: bookingInclude,
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('cancelBooking', () => {
    it('soft-cancels with update', async () => {
      const booking = {
        id: 'booking-1',
        userId,
        status: BookingStatus.SCHEDULED,
        base: { organizationId },
        schedulableResource: resourceAircraft,
        user: {},
        participants: [],
      };
      mockPrisma.booking.findFirst.mockResolvedValue(booking);
      const updated = {
        ...booking,
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
      };
      mockPrisma.booking.update.mockResolvedValue(updated);

      await expect(
        service.cancelBooking(
          'booking-1',
          userId,
          Role.STUDENT,
          organizationId,
        ),
      ).resolves.toBe(true);

      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'booking-1' },
          data: expect.objectContaining({
            status: BookingStatus.CANCELLED,
            cancelledAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('uses expanded include', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b-1' });

      await service.findById('b-1');

      expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        include: bookingInclude,
      });
    });
  });
});
