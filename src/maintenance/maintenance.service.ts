// ==========================================================================
// MaintenanceService — Predictive Maintenance Engine
// ==========================================================================
// Cron-driven telemetry scans use DEFAULT_THRESHOLDS; violations are logged
// with parameter names and limits. Processing is grouped by organization so
// each tenant's aircraft updates are isolated.
// ==========================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AirworthinessStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_THRESHOLDS,
  evaluateTelemetryViolations,
} from './thresholds.config';
import { Alert } from './alert.type';

type TelemetryWithAircraft = Prisma.TelemetryGetPayload<{
  include: { aircraft: true };
}>;

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkTelemetryThresholds(): Promise<void> {
    this.logger.log('Predictive maintenance scan started...');

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

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
      `Scanning ${recentTelemetry.length} telemetry record(s) across organizations...`,
    );

    const byOrg = new Map<string, typeof recentTelemetry>();
    for (const record of recentTelemetry) {
      const oid = record.organizationId;
      const list = byOrg.get(oid);
      if (list) {
        list.push(record);
      } else {
        byOrg.set(oid, [record]);
      }
    }

    for (const [organizationId, records] of byOrg) {
      await this.processOrgTelemetryWindow(organizationId, records);
    }

    this.logger.log('Predictive maintenance scan complete.');
  }

  private async processOrgTelemetryWindow(
    organizationId: string,
    records: TelemetryWithAircraft[],
  ): Promise<void> {
    const aircraftToGround = new Set<string>();

    for (const record of records) {
      const violations = evaluateTelemetryViolations(
        record.data,
        DEFAULT_THRESHOLDS,
      );

      for (const v of violations) {
        const isLowBound =
          v.parameter === 'oilPressure' ||
          (v.parameter === 'fuelFlow' && v.value < v.threshold);

        this.logger.warn(
          `ALERT: [org=${organizationId}] Aircraft ${record.aircraft.tailNumber} (${record.aircraftId}) — ` +
            `${v.parameter}=${v.value} ${isLowBound ? 'below' : 'above'} threshold ${v.threshold}. GROUNDING.`,
        );
        aircraftToGround.add(record.aircraftId);
      }
    }

    if (aircraftToGround.size > 0) {
      const result = await this.prisma.aircraft.updateMany({
        where: {
          id: { in: Array.from(aircraftToGround) },
          organizationId,
          airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
        },
        data: {
          airworthinessStatus: AirworthinessStatus.GROUNDED,
        },
      });

      this.logger.warn(
        `Predictive maintenance grounded ${result.count} aircraft in org ${organizationId}: ` +
          `${Array.from(aircraftToGround).join(', ')}`,
      );
    } else {
      this.logger.log(
        `Organization ${organizationId}: all telemetry within safe thresholds.`,
      );
    }
  }

  /**
   * Returns telemetry rows in the window whose sensor data violates
   * configured thresholds (re-evaluated from stored JSON).
   */
  async getAlertHistory(
    organizationId: string,
    aircraftId?: string,
    hours: number = 24,
  ): Promise<Alert[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const records = await this.prisma.telemetry.findMany({
      where: {
        organizationId,
        timestamp: { gte: since },
        ...(aircraftId ? { aircraftId } : {}),
      },
      include: { aircraft: true },
      orderBy: { timestamp: 'desc' },
    });

    const alerts: Alert[] = [];

    for (const r of records) {
      const violations = evaluateTelemetryViolations(r.data, DEFAULT_THRESHOLDS);
      for (const v of violations) {
        alerts.push({
          aircraftId: r.aircraftId,
          aircraftTailNumber: r.aircraft.tailNumber,
          parameter: v.parameter,
          value: v.value,
          threshold: v.threshold,
          timestamp: r.timestamp,
        });
      }
    }

    return alerts;
  }
}
