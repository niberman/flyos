// ==========================================================================
// BookingModule — Feature Module for Flight Scheduling
// ==========================================================================

import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { BookingService } from './booking.service';
import { BookingResolver } from './booking.resolver';
import { PilotComplianceModule } from '../pilot-compliance/pilot-compliance.module';

@Module({
  imports: [PilotComplianceModule],
  providers: [
    BookingService,
    BookingResolver,
    { provide: 'PUB_SUB', useValue: new PubSub() },
  ],
  exports: [BookingService],
})
export class BookingModule {}
