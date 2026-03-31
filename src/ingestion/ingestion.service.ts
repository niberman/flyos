// ==========================================================================
// IngestionService — Business Logic for Batch Data Ingestion
// ==========================================================================
// This service handles the bulk ingestion of maintenance log and telemetry
// data. It serves as the business logic layer between the IngestionResolver
// (Controller) and PrismaService (Model).
//
// Key Responsibilities:
//   1. Parse incoming batch JSON payloads.
//   2. Validate that each entry references a valid Aircraft ID.
//   3. Create database records linked to the correct aircraft.
//   4. Use Prisma transactions to ensure atomicity — either all records
//      in a batch are created, or none are (prevents partial ingestion).
//
// Data Flow:
//   Client → BatchMaintenanceInput/BatchTelemetryInput → IngestionResolver
//   (Controller) → IngestionService (validation + transaction) →
//   PrismaService (Model) → PostgreSQL (maintenance_logs / telemetry tables)
//
// MVC Pattern:
//   This service represents the business logic portion of the Controller
//   layer. The resolver handles request routing; this service handles
//   data validation, transformation, and persistence coordination.
// ==========================================================================

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchMaintenanceInput } from './dto/batch-maintenance.input';
import { BatchTelemetryInput } from './dto/batch-telemetry.input';

@Injectable()
export class IngestionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ingests a batch of maintenance log records.
   *
   * Processing Steps:
   *   1. Extract unique aircraft IDs from the batch entries.
   *   2. Verify all referenced aircraft exist in the database.
   *   3. Create all maintenance log records in a single transaction.
   *
   * @param input - BatchMaintenanceInput containing an array of log entries.
   * @returns Array of created MaintenanceLog records.
   * @throws BadRequestException if any aircraftId references a non-existent aircraft.
   */
  async ingestMaintenanceLogs(input: BatchMaintenanceInput) {
    // Step 1: Collect unique aircraft IDs from the batch for validation.
    const aircraftIds = [...new Set(input.entries.map((e) => e.aircraftId))];

    // Step 2: Verify all referenced aircraft exist in the database.
    // This prevents orphaned records and ensures data integrity.
    const existingAircraft = await this.prisma.aircraft.findMany({
      where: { id: { in: aircraftIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingAircraft.map((a) => a.id));
    const missingIds = aircraftIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `The following aircraft IDs do not exist: ${missingIds.join(', ')}`,
      );
    }

    // Step 3: Create all records in a Prisma transaction for atomicity.
    // If any single record fails, the entire batch is rolled back.
    const created = await this.prisma.$transaction(
      input.entries.map((entry) =>
        this.prisma.maintenanceLog.create({
          data: {
            aircraftId: entry.aircraftId,
            timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
            data: entry.data,
          },
        }),
      ),
    );

    return created;
  }

  /**
   * Ingests a batch of telemetry records.
   *
   * Processing Steps:
   *   1. Extract unique aircraft IDs from the batch entries.
   *   2. Verify all referenced aircraft exist in the database.
   *   3. Create all telemetry records in a single transaction.
   *
   * The created telemetry records will be scanned by the predictive
   * maintenance cron job to detect threshold violations.
   *
   * @param input - BatchTelemetryInput containing an array of sensor data entries.
   * @returns Array of created Telemetry records.
   * @throws BadRequestException if any aircraftId references a non-existent aircraft.
   */
  async ingestTelemetry(input: BatchTelemetryInput) {
    // Step 1: Collect unique aircraft IDs for validation.
    const aircraftIds = [...new Set(input.entries.map((e) => e.aircraftId))];

    // Step 2: Verify aircraft existence.
    const existingAircraft = await this.prisma.aircraft.findMany({
      where: { id: { in: aircraftIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingAircraft.map((a) => a.id));
    const missingIds = aircraftIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `The following aircraft IDs do not exist: ${missingIds.join(', ')}`,
      );
    }

    // Step 3: Atomic batch creation via transaction.
    const created = await this.prisma.$transaction(
      input.entries.map((entry) =>
        this.prisma.telemetry.create({
          data: {
            aircraftId: entry.aircraftId,
            timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
            data: entry.data,
          },
        }),
      ),
    );

    return created;
  }
}
