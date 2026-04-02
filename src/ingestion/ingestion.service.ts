// ==========================================================================
// IngestionService — Business Logic for Batch Data Ingestion
// ==========================================================================
// Validates aircraft IDs against the caller's organization, then creates
// maintenance logs and telemetry with explicit organizationId.
// ==========================================================================

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchMaintenanceInput } from './dto/batch-maintenance.input';
import { BatchTelemetryInput } from './dto/batch-telemetry.input';

@Injectable()
export class IngestionService {
  constructor(private readonly prisma: PrismaService) {}

  async ingestMaintenanceLogs(
    input: BatchMaintenanceInput,
    organizationId: string,
  ) {
    const aircraftIds = [...new Set(input.entries.map((e) => e.aircraftId))];

    const existingAircraft = await this.prisma.aircraft.findMany({
      where: { id: { in: aircraftIds }, organizationId },
      select: { id: true },
    });
    const existingIds = new Set(existingAircraft.map((a) => a.id));
    const missingIds = aircraftIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `The following aircraft IDs do not exist or do not belong to your organization: ${missingIds.join(', ')}`,
      );
    }

    const created = await this.prisma.$transaction(
      input.entries.map((entry) =>
        this.prisma.maintenanceLog.create({
          data: {
            aircraftId: entry.aircraftId,
            organizationId,
            timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
            data: entry.data,
          },
        }),
      ),
    );

    return created;
  }

  async ingestTelemetry(input: BatchTelemetryInput, organizationId: string) {
    const aircraftIds = [...new Set(input.entries.map((e) => e.aircraftId))];

    const existingAircraft = await this.prisma.aircraft.findMany({
      where: { id: { in: aircraftIds }, organizationId },
      select: { id: true },
    });
    const existingIds = new Set(existingAircraft.map((a) => a.id));
    const missingIds = aircraftIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `The following aircraft IDs do not exist or do not belong to your organization: ${missingIds.join(', ')}`,
      );
    }

    const created = await this.prisma.$transaction(
      input.entries.map((entry) =>
        this.prisma.telemetry.create({
          data: {
            aircraftId: entry.aircraftId,
            organizationId,
            timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
            data: entry.data,
          },
        }),
      ),
    );

    return created;
  }
}
