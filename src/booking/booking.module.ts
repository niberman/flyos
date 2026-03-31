// ==========================================================================
// BookingModule — Feature Module for Flight Scheduling
// ==========================================================================
// Encapsulates the booking resolver and service. The booking service
// depends on PrismaService (globally available) for database operations.
// ==========================================================================

import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingResolver } from './booking.resolver';

@Module({
  providers: [BookingService, BookingResolver],
  exports: [BookingService],
})
export class BookingModule {}
