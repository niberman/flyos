// ==========================================================================
// BookingType — GraphQL Object Type for Flight Bookings
// ==========================================================================
// Defines the **View** layer representation of a Booking. Includes nested
// UserType and AircraftType fields to allow clients to query related data
// in a single GraphQL request (one of GraphQL's key advantages over REST).
// ==========================================================================

import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserType } from '../users/user.type';
import { AircraftType } from '../aircraft/aircraft.type';

@ObjectType('Booking', {
  description: 'A scheduled flight booking for a user and aircraft.',
})
export class BookingType {
  @Field(() => ID, { description: 'Unique identifier (UUID) for the booking.' })
  id: string;

  @Field(() => Date, { description: 'Start time of the booked flight block.' })
  startTime: Date;

  @Field(() => Date, { description: 'End time of the booked flight block.' })
  endTime: Date;

  @Field(() => Date, { description: 'Timestamp when the booking was created.' })
  createdAt: Date;

  @Field(() => String, { description: 'UUID of the base where the flight originates.' })
  baseId: string;

  @Field(() => String, { description: 'UUID of the user who made the booking.' })
  userId: string;

  @Field(() => String, { description: 'UUID of the booked aircraft.' })
  aircraftId: string;

  @Field(() => UserType, {
    nullable: true,
    description: 'The user who owns this booking (populated via relation).',
  })
  user?: UserType;

  @Field(() => AircraftType, {
    nullable: true,
    description: 'The aircraft reserved for this booking (populated via relation).',
  })
  aircraft?: AircraftType;
}
