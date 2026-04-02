import { Module } from '@nestjs/common';
import { PilotComplianceService } from './pilot-compliance.service';
import { PilotComplianceResolver } from './pilot-compliance.resolver';

@Module({
  providers: [PilotComplianceService, PilotComplianceResolver],
  exports: [PilotComplianceService],
})
export class PilotComplianceModule {}
