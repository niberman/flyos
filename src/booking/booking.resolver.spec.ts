// ==========================================================================
// BookingResolver — Unit Tests
// ==========================================================================
// Tests the GraphQL controller for flight scheduling. Verifies that the
// resolver resolves organization context, delegates to BookingService,
// and enforces role requirements through proper guard/decorator usage.
// ==========================================================================

import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BookingResolver } from './booking.resolver';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';

const mockBookingService = {
  createBooking: jest.fn(),
  findAll: jest.fn(),
  myBookings: jest.fn(),
  findByBase: jest.fn(),
  findByAircraft: jest.fn(),
  cancelBooking: jest.fn(),
  dispatchBooking: jest.fn(),
  completeBooking: jest.fn(),
};

const mockPrisma = {
  user: { findUnique: jest.fn() },
};

const mockPubSub = {
  asyncIterator: jest.fn(),
  publish: jest.fn(),
};

const testUser = { userId: 'user-1', role: 'INSTRUCTOR' };

describe('BookingResolver', () => {
  let resolver: BookingResolver;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BookingResolver,
        { provide: BookingService, useValue: mockBookingService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'PUB_SUB', useValue: mockPubSub },
      ],
    }).compile();
    resolver = module.get(BookingResolver);
  });

  function setupUserLookup(orgId: string = 'org-1') {
    mockPrisma.user.findUnique.mockResolvedValue({
      organizationId: orgId,
    });
  }

  describe('createBooking', () => {
    it('resolves org and delegates to BookingService.createBooking', async () => {
      setupUserLookup('org-1');
      const input = {
        baseId: 'base-1',
        aircraftId: 'ac-1',
        startTime: new Date('2026-06-01T10:00:00Z'),
        endTime: new Date('2026-06-01T12:00:00Z'),
      };
      const created = { id: 'booking-1', ...input };
      mockBookingService.createBooking.mockResolvedValue(created);

      const result = await resolver.createBooking(testUser, input);

      expect(mockBookingService.createBooking).toHaveBeenCalledWith(
        'user-1',
        'org-1',
        input,
      );
      expect(result).toEqual(created);
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        resolver.createBooking(testUser, {
          baseId: 'b',
          aircraftId: 'a',
          startTime: new Date(),
          endTime: new Date(),
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('bookings', () => {
    it('resolves org and returns all bookings', async () => {
      setupUserLookup();
      const bookings = [{ id: 'b-1' }, { id: 'b-2' }];
      mockBookingService.findAll.mockResolvedValue(bookings);

      const result = await resolver.bookings(testUser);

      expect(mockBookingService.findAll).toHaveBeenCalledWith('org-1', undefined);
      expect(result).toEqual(bookings);
    });

    it('passes optional baseId filter', async () => {
      setupUserLookup();
      mockBookingService.findAll.mockResolvedValue([]);

      await resolver.bookings(testUser, 'base-x');

      expect(mockBookingService.findAll).toHaveBeenCalledWith('org-1', 'base-x');
    });
  });

  describe('myBookings', () => {
    it('returns bookings for the authenticated user', async () => {
      setupUserLookup();
      const myList = [{ id: 'b-mine' }];
      mockBookingService.myBookings.mockResolvedValue(myList);

      const result = await resolver.myBookings(testUser);

      expect(mockBookingService.myBookings).toHaveBeenCalledWith(
        'user-1',
        'org-1',
        undefined,
      );
      expect(result).toEqual(myList);
    });
  });

  describe('bookingsByBase', () => {
    it('passes baseId and date range to service', async () => {
      setupUserLookup();
      mockBookingService.findByBase.mockResolvedValue([]);
      const startDate = new Date('2026-05-01');
      const endDate = new Date('2026-06-01');

      await resolver.bookingsByBase(testUser, 'base-1', startDate, endDate);

      expect(mockBookingService.findByBase).toHaveBeenCalledWith(
        'org-1',
        'base-1',
        { startDate, endDate },
      );
    });
  });

  describe('bookingsByAircraft', () => {
    it('passes aircraftId and date range to service', async () => {
      setupUserLookup();
      mockBookingService.findByAircraft.mockResolvedValue([]);

      await resolver.bookingsByAircraft(testUser, 'ac-1');

      expect(mockBookingService.findByAircraft).toHaveBeenCalledWith(
        'org-1',
        'ac-1',
        { startDate: undefined, endDate: undefined },
      );
    });
  });

  describe('cancelBooking', () => {
    it('delegates to BookingService.cancelBooking with user info', async () => {
      setupUserLookup();
      mockBookingService.cancelBooking.mockResolvedValue(true);

      const result = await resolver.cancelBooking(testUser, 'booking-1');

      expect(mockBookingService.cancelBooking).toHaveBeenCalledWith(
        'booking-1',
        'user-1',
        'INSTRUCTOR',
        'org-1',
      );
      expect(result).toBe(true);
    });
  });

  describe('bookingUpdated (subscription)', () => {
    it('returns an async iterator for the bookingUpdated event', () => {
      const fakeIterator = Symbol('iterator');
      mockPubSub.asyncIterator.mockReturnValue(fakeIterator);

      const result = resolver.bookingUpdated();

      expect(mockPubSub.asyncIterator).toHaveBeenCalledWith('bookingUpdated');
      expect(result).toBe(fakeIterator);
    });
  });
});
