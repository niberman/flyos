// ==========================================================================
// AircraftModule — Feature Module for Aircraft Management
// ==========================================================================
// Encapsulates aircraft service and resolver. Exports AircraftService so
// other modules (like MaintenanceModule) can update aircraft status.
// ==========================================================================

import { Module } from '@nestjs/common';
import { AircraftService } from './aircraft.service';
import { AircraftResolver } from './aircraft.resolver';

@Module({
  providers: [AircraftService, AircraftResolver],
  exports: [AircraftService],
})
export class AircraftModule {}
