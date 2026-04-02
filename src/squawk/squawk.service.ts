// ==========================================================================
// SquawkService — Relational squawks and airworthiness side effects
// ==========================================================================

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AirworthinessStatus, SquawkStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SquawkService {
  constructor(private readonly prisma: PrismaService) {}

  async createSquawk(
    organizationId: string,
    data: {
      aircraftId: string;
      title: string;
      description?: string | null;
      groundsAircraft?: boolean;
    },
  ) {
    const aircraft = await this.prisma.aircraft.findFirst({
      where: { id: data.aircraftId, organizationId },
    });
    if (!aircraft) {
      throw new BadRequestException('Aircraft not found in your organization.');
    }

    const squawk = await this.prisma.squawk.create({
      data: {
        organizationId,
        aircraftId: data.aircraftId,
        title: data.title,
        description: data.description ?? null,
        groundsAircraft: data.groundsAircraft ?? false,
        status: SquawkStatus.OPEN,
      },
    });

    if (squawk.groundsAircraft && squawk.status === SquawkStatus.OPEN) {
      await this.prisma.aircraft.update({
        where: { id: data.aircraftId },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
    }

    return squawk;
  }

  async updateSquawkStatus(
    organizationId: string,
    squawkId: string,
    status: SquawkStatus,
  ) {
    const existing = await this.prisma.squawk.findFirst({
      where: { id: squawkId, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('Squawk not found.');
    }

    const squawk = await this.prisma.squawk.update({
      where: { id: squawkId },
      data: {
        status,
        clearedAt:
          status === SquawkStatus.CLEARED
            ? new Date()
            : status === SquawkStatus.OPEN
              ? null
              : existing.clearedAt,
      },
    });

    await this.reconcileAircraftAirworthiness(existing.aircraftId);

    return squawk;
  }

  async listForOrganization(
    organizationId: string,
    aircraftId?: string,
  ) {
    return this.prisma.squawk.findMany({
      where: {
        organizationId,
        ...(aircraftId ? { aircraftId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * After squawk changes: if any OPEN + grounds squawk exists, keep GROUNDED;
   * otherwise set FLIGHT_READY (telemetry may re-ground on next cron).
   */
  async reconcileAircraftAirworthiness(aircraftId: string): Promise<void> {
    const openGrounding = await this.prisma.squawk.count({
      where: {
        aircraftId,
        status: SquawkStatus.OPEN,
        groundsAircraft: true,
      },
    });

    if (openGrounding > 0) {
      await this.prisma.aircraft.update({
        where: { id: aircraftId },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
      return;
    }

    await this.prisma.aircraft.update({
      where: { id: aircraftId },
      data: { airworthinessStatus: AirworthinessStatus.FLIGHT_READY },
    });
  }

  async hasOpenGroundingSquawk(aircraftId: string): Promise<boolean> {
    const n = await this.prisma.squawk.count({
      where: {
        aircraftId,
        status: SquawkStatus.OPEN,
        groundsAircraft: true,
      },
    });
    return n > 0;
  }
}
