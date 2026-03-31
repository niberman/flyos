// ==========================================================================
// CreateBookingInput — DTO for Creating a Flight Booking
// ==========================================================================
// Defines the required fields for scheduling a new flight booking.
// The userId is NOT included here — it is extracted from the authenticated
// user's JWT token by the resolver, preventing users from creating
// bookings on behalf of others (unless they have elevated roles).
// ==========================================================================

import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsDateString } from 'class-validator';

@InputType({ description: 'Input for creating a new flight booking.' })
export class CreateBookingInput {
  @Field(() => String, { description: 'UUID of the aircraft to book.' })
  @IsUUID()
  aircraftId: string;

  @Field(() => Date, {
    description: 'Start time of the booking (ISO 8601 format).',
  })
  @IsDateString()
  startTime: Date;

  @Field(() => Date, {
    description: 'End time of the booking (ISO 8601 format).',
  })
  @IsDateString()
  endTime: Date;
}
