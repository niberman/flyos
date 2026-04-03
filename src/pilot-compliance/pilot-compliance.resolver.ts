// ==========================================================================
// PilotComplianceResolver — Minimal GraphQL for seeding / admin qualification rows
// ==========================================================================

import { Resolver, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { PilotMedicalType } from './pilot-medical.type';
import { FlightReviewType } from './flight-review.type';
import { AircraftCheckoutType } from './aircraft-checkout.type';

@Resolver()
export class PilotComplianceResolver {
  constructor(private readonly prisma: PrismaService) {}

  private async orgId(userId: string): Promise<string> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    if (!u) throw new UnauthorizedException('User not found.');
    return u.organizationId;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISPATCHER)
  @Mutation(() => PilotMedicalType, {
    description:
      'Create or replace the latest pilot medical for a user (dispatcher).',
  })
  async upsertPilotMedical(
    @CurrentUser() user: { userId: string },
    @Args('userId', { type: () => ID }) targetUserId: string,
    @Args('medicalClass', { type: () => String }) medicalClass: string,
    @Args('expiresAt', { type: () => Date }) expiresAt: Date,
  ): Promise<PilotMedicalType> {
    const organizationId = await this.orgId(user.userId);
    await this.prisma.pilotMedical.deleteMany({
      where: { userId: targetUserId, organizationId },
    });
    const row = await this.prisma.pilotMedical.create({
      data: {
        userId: targetUserId,
        organizationId,
        class: medicalClass,
        expiresAt,
      },
    });
    return {
      ...row,
      medicalClass: row.class,
    } as PilotMedicalType;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISPATCHER)
  @Mutation(() => FlightReviewType, {
    description:
      'Create or replace the latest flight review for a user (dispatcher).',
  })
  async upsertFlightReview(
    @CurrentUser() user: { userId: string },
    @Args('userId', { type: () => ID }) targetUserId: string,
    @Args('completedAt', { type: () => Date }) completedAt: Date,
    @Args('expiresAt', { type: () => Date }) expiresAt: Date,
  ): Promise<FlightReviewType> {
    const organizationId = await this.orgId(user.userId);
    await this.prisma.flightReviewRecord.deleteMany({
      where: { userId: targetUserId, organizationId },
    });
    return this.prisma.flightReviewRecord.create({
      data: {
        userId: targetUserId,
        organizationId,
        completedAt,
        expiresAt,
      },
    }) as unknown as FlightReviewType;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISPATCHER)
  @Mutation(() => AircraftCheckoutType, {
    description: 'Create or replace aircraft checkout for a user (dispatcher).',
  })
  async upsertAircraftCheckout(
    @CurrentUser() user: { userId: string },
    @Args('userId', { type: () => ID }) targetUserId: string,
    @Args('aircraftId', { type: () => ID }) aircraftId: string,
    @Args('expiresAt', { type: () => Date }) expiresAt: Date,
  ): Promise<AircraftCheckoutType> {
    const organizationId = await this.orgId(user.userId);
    await this.prisma.aircraftCheckout.deleteMany({
      where: { userId: targetUserId, aircraftId, organizationId },
    });
    return this.prisma.aircraftCheckout.create({
      data: {
        userId: targetUserId,
        aircraftId,
        organizationId,
        expiresAt,
      },
    }) as unknown as AircraftCheckoutType;
  }
}
