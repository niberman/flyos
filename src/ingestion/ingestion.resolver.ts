// ==========================================================================
// IngestionResolver — GraphQL Controller for Data Ingestion
// ==========================================================================
// This resolver acts as the **Controller** in the MVC pattern for the
// data ingestion subsystem. It provides GraphQL mutations designed to
// accept batch JSON uploads for maintenance logs and telemetry data.
//
// Access Control:
//   - ingestMaintenanceLogs: Restricted to INSTRUCTOR and DISPATCHER roles,
//     as maintenance data should only be uploaded by authorized personnel.
//   - ingestTelemetry: Restricted to INSTRUCTOR and DISPATCHER roles,
//     as sensor data ingestion is a maintenance operation.
//
// Data Flow:
//   Client sends batch JSON → GraphQL Mutation → IngestionResolver
//   (Controller) → IngestionService (validates & transforms) →
//   PrismaService (Model) → PostgreSQL (maintenance_logs / telemetry)
//
// The mutations return the created records so the client can confirm
// successful ingestion and retrieve the generated IDs.
// ==========================================================================

import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { MaintenanceLogType } from './maintenance-log.type';
import { TelemetryType } from './telemetry.type';
import { BatchMaintenanceInput } from './dto/batch-maintenance.input';
import { BatchTelemetryInput } from './dto/batch-telemetry.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver()
export class IngestionResolver {
  constructor(private readonly ingestionService: IngestionService) {}

  /**
   * Mutation: ingestMaintenanceLogs
   * Accepts a batch of maintenance log entries and persists them.
   *
   * Each entry in the batch is validated to ensure it references a valid
   * aircraft ID. The entire batch is processed atomically — if one entry
   * fails validation, no records are created.
   *
   * Restricted to INSTRUCTOR and DISPATCHER roles via RBAC guards.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Mutation(() => [MaintenanceLogType], {
    description:
      'Batch upload maintenance log records. INSTRUCTOR and DISPATCHER only.',
  })
  async ingestMaintenanceLogs(
    @Args('input') input: BatchMaintenanceInput,
  ): Promise<MaintenanceLogType[]> {
    return this.ingestionService.ingestMaintenanceLogs(input);
  }

  /**
   * Mutation: ingestTelemetry
   * Accepts a batch of telemetry data entries and persists them.
   *
   * Telemetry data includes sensor readings such as oil pressure and
   * cylinder head temperature. Once stored, these records are scanned
   * by the predictive maintenance cron job every 5 minutes.
   *
   * Restricted to INSTRUCTOR and DISPATCHER roles via RBAC guards.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Mutation(() => [TelemetryType], {
    description:
      'Batch upload telemetry sensor data. INSTRUCTOR and DISPATCHER only.',
  })
  async ingestTelemetry(
    @Args('input') input: BatchTelemetryInput,
  ): Promise<TelemetryType[]> {
    return this.ingestionService.ingestTelemetry(input);
  }
}
