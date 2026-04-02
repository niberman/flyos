// ==========================================================================
// CreateBookingInput — DTO for Creating a Flight Booking
// ==========================================================================
// Defines the required fields for scheduling a new flight booking.
// The userId is NOT included here — it is extracted from the authenticated
// user's JWT token by the resolver, preventing users from creating
// bookings on behalf of others (unless they have elevated roles).
// ==========================================================================

import { InputType, Field, ID } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsUUID, IsDate } from 'class-validator';

@InputType({ description: 'Input for creating a new flight booking.' })
export class CreateBookingInput {
  @Field(() => ID, { description: 'UUID of the base where the flight originates.' })
  @IsUUID()
  baseId: string;

  @Field(() => ID, { description: 'UUID of the aircraft to book.' })
  @IsUUID()
  aircraftId: string;

  @Field(() => Date, {
    description: 'Start time of the booking (ISO 8601 format).',
  })
  // GraphQL DateTime values arrive as Date objects by the time class-validator
  // runs, so validate the transformed object rather than the raw input string.
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @Field(() => Date, {
    description: 'End time of the booking (ISO 8601 format).',
  })
  @Type(() => Date)
  @IsDate()
  endTime: Date;
}
