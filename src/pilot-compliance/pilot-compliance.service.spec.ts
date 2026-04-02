import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PilotComplianceService } from './pilot-compliance.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PilotComplianceService', () => {
  let service: PilotComplianceService;
  const mockPrisma = {
    user: { findFirst: jest.fn() },
    pilotMedical: { findFirst: jest.fn(), deleteMany: jest.fn() },
    flightReviewRecord: { findFirst: jest.fn(), deleteMany: jest.fn() },
    aircraftCheckout: { findFirst: jest.fn(), deleteMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PilotComplianceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(PilotComplianceService);
  });

  const start = new Date('2026-08-01T12:00:00.000Z');

  it('passes when renter has medical, BFR, and checkout', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      role: Role.STUDENT,
    });
    mockPrisma.pilotMedical.findFirst.mockResolvedValue({ id: 'm1' });
    mockPrisma.flightReviewRecord.findFirst.mockResolvedValue({ id: 'f1' });
    mockPrisma.aircraftCheckout.findFirst.mockResolvedValue({ id: 'c1' });

    await expect(
      service.assertEligibleForBooking('org-1', {
        renterUserId: 'u1',
        aircraftId: 'ac-1',
        startTime: start,
      }),
    ).resolves.toBeUndefined();
  });

  it('requires instructor medical when renter is STUDENT and instructor set', async () => {
    mockPrisma.user.findFirst
      .mockResolvedValueOnce({ id: 'u1', role: Role.STUDENT })
      .mockResolvedValueOnce({ id: 'u2', role: Role.INSTRUCTOR });
    mockPrisma.pilotMedical.findFirst
      .mockResolvedValueOnce({ id: 'm1' })
      .mockResolvedValueOnce(null);
    mockPrisma.flightReviewRecord.findFirst.mockResolvedValue({ id: 'f1' });
    mockPrisma.aircraftCheckout.findFirst.mockResolvedValue({ id: 'c1' });

    await expect(
      service.assertEligibleForBooking('org-1', {
        renterUserId: 'u1',
        instructorUserId: 'u2',
        aircraftId: 'ac-1',
        startTime: start,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('does not require instructor medical when renter is not a student', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      role: Role.DISPATCHER,
    });
    mockPrisma.pilotMedical.findFirst.mockResolvedValue({ id: 'm1' });
    mockPrisma.flightReviewRecord.findFirst.mockResolvedValue({ id: 'f1' });
    mockPrisma.aircraftCheckout.findFirst.mockResolvedValue({ id: 'c1' });

    await expect(
      service.assertEligibleForBooking('org-1', {
        renterUserId: 'u1',
        instructorUserId: 'u2',
        aircraftId: 'ac-1',
        startTime: start,
      }),
    ).resolves.toBeUndefined();

    expect(mockPrisma.pilotMedical.findFirst).toHaveBeenCalled();
  });
});
