// ==========================================================================
// MaintenanceService — Predictive Maintenance Engine
// ==========================================================================
// This service implements the predictive maintenance cron job that runs
// every 5 minutes to scan telemetry data and automatically ground aircraft
// whose sensor readings violate safety thresholds.
//
// ---- Architecture Role ----
// In the MVC pattern, this is a background **Controller** — it does not
// respond to incoming requests but instead proactively reads from the Model
// layer (PrismaService) and writes updates when unsafe conditions are found.
//
// ---- How It Works ----
// 1. The @Cron() decorator (from @nestjs/schedule) triggers the
//    checkTelemetryThresholds() method every 5 minutes.
// 2. The method queries ALL telemetry records from the last 5 minutes
//    (matching the cron interval to avoid re-processing old data).
// 3. For each telemetry record, the JSONB `data` field is inspected:
//    - If cylinderHeadTemperature exceeds 400°F → GROUND the aircraft.
//    - If oilPressure drops below 30 PSI → GROUND the aircraft.
// 4. When a threshold violation is detected:
//    a. The aircraft's airworthinessStatus is updated to GROUNDED.
//    b. An alert is logged to the server console.
//
// ---- Static Thresholds ----
// These thresholds are defined as class constants for clarity and easy
// modification. In a production system, these might be loaded from a
// configuration file or database, but static values fulfill the
// assignment requirements and keep the implementation straightforward.
//
// Data Flow:
//   @Cron trigger → MaintenanceService.checkTelemetryThresholds() →
//   PrismaService queries telemetry (Model) → Evaluate thresholds →
//   PrismaService updates aircraft status (Model) → Log alert
// ==========================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AirworthinessStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Interface describing the expected shape of telemetry sensor data
 * stored in the JSONB `data` field. This helps TypeScript understand
 * the structure when we parse the raw JSON from PostgreSQL.
 */
interface TelemetrySensorData {
  oilPressure?: number;
  cylinderHeadTemperature?: number;
  [key: string]: any; // Allow additional sensor fields
}

@Injectable()
export class MaintenanceService {
  // ---- Static Safety Thresholds ----
  // These constants define the maximum/minimum acceptable sensor values.
  // Exceeding these values triggers an automatic grounding of the aircraft.

  /** Maximum allowable cylinder head temperature in degrees Fahrenheit. */
  private static readonly MAX_CYLINDER_HEAD_TEMP = 400;

  /** Minimum allowable oil pressure in PSI. */
  private static readonly MIN_OIL_PRESSURE = 30;

  /** NestJS Logger instance for structured alert logging. */
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Predictive Maintenance Cron Job
   *
   * Runs every 5 minutes (configured via @Cron decorator).
   * Scans recent telemetry records and grounds aircraft that violate
   * safety thresholds.
   *
   * Algorithm:
   *   1. Calculate the time window (now minus 5 minutes).
   *   2. Query all telemetry records within that window.
   *   3. For each record, parse the JSONB data and check thresholds.
   *   4. Collect aircraft IDs that need to be grounded.
   *   5. Batch-update all violating aircraft to GROUNDED status.
   *   6. Log alerts for each grounded aircraft.
   *
   * The 5-minute window matches the cron interval to avoid:
   *   - Missing records (gap between intervals).
   *   - Re-processing old records (overlapping intervals).
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkTelemetryThresholds(): Promise<void> {
    this.logger.log('Predictive maintenance scan started...');

    // Step 1: Define the time window — only scan data from the last 5 minutes.
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Step 2: Query recent telemetry records from the Model layer.
    // Include the aircraft relation so we have access to the tail number
    // and current status without an additional query.
    const recentTelemetry = await this.prisma.telemetry.findMany({
      where: {
        timestamp: { gte: fiveMinutesAgo },
      },
      include: {
        aircraft: true,
      },
    });

    if (recentTelemetry.length === 0) {
      this.logger.log('No recent telemetry records found. Scan complete.');
      return;
    }

    this.logger.log(
      `Scanning ${recentTelemetry.length} telemetry record(s)...`,
    );

    // Step 3: Evaluate each telemetry record against safety thresholds.
    // Use a Set to collect unique aircraft IDs that need grounding
    // (an aircraft may have multiple violating records).
    const aircraftToGround = new Set<string>();

    for (const record of recentTelemetry) {
      const sensorData = record.data as TelemetrySensorData;

      // Skip records that don't contain the expected sensor fields.
      // The JSONB data field is flexible — not all records may have
      // every sensor type.
      if (sensorData === null || typeof sensorData !== 'object') {
        continue;
      }

      // ---- Threshold Check: Cylinder Head Temperature ----
      // If CHT exceeds 400°F, the engine is overheating and the aircraft
      // must be grounded immediately to prevent engine failure.
      if (
        sensorData.cylinderHeadTemperature !== undefined &&
        sensorData.cylinderHeadTemperature > MaintenanceService.MAX_CYLINDER_HEAD_TEMP
      ) {
        this.logger.warn(
          `ALERT: Aircraft ${record.aircraft.tailNumber} (${record.aircraftId}) ` +
            `has cylinder head temperature of ${sensorData.cylinderHeadTemperature}°F ` +
            `(threshold: ${MaintenanceService.MAX_CYLINDER_HEAD_TEMP}°F). GROUNDING.`,
        );
        aircraftToGround.add(record.aircraftId);
      }

      // ---- Threshold Check: Oil Pressure ----
      // If oil pressure drops below 30 PSI, there may be an oil leak or
      // pump failure. The aircraft must be grounded for inspection.
      if (
        sensorData.oilPressure !== undefined &&
        sensorData.oilPressure < MaintenanceService.MIN_OIL_PRESSURE
      ) {
        this.logger.warn(
          `ALERT: Aircraft ${record.aircraft.tailNumber} (${record.aircraftId}) ` +
            `has oil pressure of ${sensorData.oilPressure} PSI ` +
            `(threshold: ${MaintenanceService.MIN_OIL_PRESSURE} PSI). GROUNDING.`,
        );
        aircraftToGround.add(record.aircraftId);
      }
    }

    // Step 4: Batch-update all violating aircraft to GROUNDED status.
    if (aircraftToGround.size > 0) {
      // Use updateMany for efficient batch update via the Model layer.
      const result = await this.prisma.aircraft.updateMany({
        where: {
          id: { in: Array.from(aircraftToGround) },
          // Only update aircraft that aren't already grounded to avoid
          // unnecessary writes and misleading log counts.
          airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
        },
        data: {
          airworthinessStatus: AirworthinessStatus.GROUNDED,
        },
      });

      this.logger.warn(
        `Predictive maintenance grounded ${result.count} aircraft: ` +
          `${Array.from(aircraftToGround).join(', ')}`,
      );
    } else {
      this.logger.log(
        'All telemetry within safe thresholds. No aircraft grounded.',
      );
    }

    this.logger.log('Predictive maintenance scan complete.');
  }
}
