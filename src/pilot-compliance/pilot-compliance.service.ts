// ==========================================================================
// PilotComplianceService — Booking eligibility from relational qualification rows
// ==========================================================================

import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface BookingComplianceContext {
  renterUserId: string;
  instructorUserId?: string | null;
  /** Set when the booking targets an aircraft-backed resource. */
  aircraftId: string | null;
  startTime: Date;
}

@Injectable()
export class PilotComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures renter (and instructor when required) have valid medical, BFR,
   * and aircraft checkout for the slot. Instructor medical only when renter is a student.
   */
  async assertEligibleForBooking(
    organizationId: string,
    ctx: BookingComplianceContext,
  ): Promise<void> {
    const renter = await this.prisma.user.findFirst({
      where: { id: ctx.renterUserId, organizationId },
    });
    if (!renter) {
      throw new BadRequestException('Renter user not found in your organization.');
    }

    const med = await this.prisma.pilotMedical.findFirst({
      where: {
        userId: ctx.renterUserId,
        expiresAt: { gte: ctx.startTime },
      },
      orderBy: { expiresAt: 'desc' },
    });
    if (!med) {
      throw new BadRequestException(
        'Renter does not have a pilot medical on file that is valid for this booking start time.',
      );
    }

    const fr = await this.prisma.flightReviewRecord.findFirst({
      where: {
        userId: ctx.renterUserId,
        expiresAt: { gte: ctx.startTime },
      },
      orderBy: { expiresAt: 'desc' },
    });
    if (!fr) {
      throw new BadRequestException(
        'Renter does not have a flight review record valid for this booking start time.',
      );
    }

    if (ctx.aircraftId) {
      const checkout = await this.prisma.aircraftCheckout.findFirst({
        where: {
          userId: ctx.renterUserId,
          aircraftId: ctx.aircraftId,
          expiresAt: { gte: ctx.startTime },
        },
        orderBy: { expiresAt: 'desc' },
      });
      if (!checkout) {
        throw new BadRequestException(
          'Renter does not have a current aircraft checkout for this aircraft.',
        );
      }
    }

    if (ctx.instructorUserId && renter.role === Role.STUDENT) {
      const inst = await this.prisma.user.findFirst({
        where: { id: ctx.instructorUserId, organizationId },
      });
      if (!inst) {
        throw new BadRequestException(
          'Instructor user not found in your organization.',
        );
      }
      const instMed = await this.prisma.pilotMedical.findFirst({
        where: {
          userId: ctx.instructorUserId,
          expiresAt: { gte: ctx.startTime },
        },
        orderBy: { expiresAt: 'desc' },
      });
      if (!instMed) {
        throw new BadRequestException(
          'Instructor does not have a pilot medical on file valid for this booking (required when flying with a student pilot).',
        );
      }
    }
  }
}
