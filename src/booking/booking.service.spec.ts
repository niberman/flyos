import { Test } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { AirworthinessStatus } from '@prisma/client';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  aircraft: { findUnique: jest.fn() },
  booking: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const userId = 'user-1';
const aircraftId = 'aircraft-1';
const baseInput = {
  baseId: 'base-1',
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
      ],
    }).compile();
    service = module.get(BookingService);
  });

  describe('createBooking', () => {
    it('throws BadRequestException when aircraft not found', async () => {
      mockPrisma.aircraft.findUnique.mockResolvedValue(null);

      await expect(service.createBooking(userId, baseInput)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when aircraft is GROUNDED', async () => {
      mockPrisma.aircraft.findUnique.mockResolvedValue({
        id: aircraftId,
        tailNumber: 'N12345',
        airworthinessStatus: AirworthinessStatus.GROUNDED,
      });

      await expect(service.createBooking(userId, baseInput)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException when time block overlaps', async () => {
      mockPrisma.aircraft.findUnique.mockResolvedValue({
        id: aircraftId,
        airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
      });
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'existing-booking',
        startTime: new Date('2026-06-01T09:00:00Z'),
        endTime: new Date('2026-06-01T11:00:00Z'),
      });

      await expect(service.createBooking(userId, baseInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates a booking when all checks pass', async () => {
      mockPrisma.aircraft.findUnique.mockResolvedValue({
        id: aircraftId,
        airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      const created = { id: 'booking-1', userId, aircraftId };
      mockPrisma.booking.create.mockResolvedValue(created);

      const result = await service.createBooking(userId, baseInput);

      expect(result).toEqual(created);
      expect(mockPrisma.booking.create).toHaveBeenCalledWith({
        data: {
          userId,
          aircraftId,
          baseId: 'base-1',
          startTime: expect.any(Date),
          endTime: expect.any(Date),
        },
        include: { user: true, aircraft: true },
      });
    });
  });

  describe('findAll', () => {
    it('returns all bookings without filter', async () => {
      const bookings = [{ id: '1' }];
      mockPrisma.booking.findMany.mockResolvedValue(bookings);

      expect(await service.findAll()).toEqual(bookings);
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: { user: true, aircraft: true },
        orderBy: { startTime: 'asc' },
      });
    });

    it('filters by userId when provided', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);

      await service.findAll('user-1');

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { user: true, aircraft: true },
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('findById', () => {
    it('returns a booking by id', async () => {
      const booking = { id: 'b-1' };
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      expect(await service.findById('b-1')).toEqual(booking);
      expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        include: { user: true, aircraft: true },
      });
    });
  });
});
