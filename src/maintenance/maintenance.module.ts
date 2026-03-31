// ==========================================================================
// MaintenanceModule — Predictive Maintenance Engine Module
// ==========================================================================
// This module encapsulates the background maintenance cron job.
// It imports AircraftModule to access AircraftService for status updates
// (though it currently uses PrismaService directly for batch efficiency).
//
// The @Cron() decorator in MaintenanceService is activated by the
// ScheduleModule imported in AppModule.
// ==========================================================================

import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

@Module({
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
