// ==========================================================================
// BookingType — GraphQL Object Type for Flight Bookings
// ==========================================================================

import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { BookingStatus } from '@prisma/client';
import { UserType } from '../users/user.type';
import { AircraftType } from '../aircraft/aircraft.type';
import { BaseType } from '../base/base.type';
import { SchedulableResourceType } from './schedulable-resource.type';
import { BookingParticipantType } from './booking-participant.type';

registerEnumType(BookingStatus, {
  name: 'BookingStatus',
  description: 'Booking lifecycle: scheduled, dispatched, in progress, completed, or cancelled.',
});

@ObjectType('Booking', {
  description: 'A scheduled reservation for a schedulable resource at a base.',
})
export class BookingType {
  @Field(() => ID, { description: 'Unique identifier (UUID) for the booking.' })
  id: string;

  @Field(() => Date, { description: 'Start time of the booked block.' })
  startTime: Date;

  @Field(() => Date, { description: 'End time of the booked block.' })
  endTime: Date;

  @Field(() => BookingStatus)
  status: BookingStatus;

  @Field(() => Date, { nullable: true })
  dispatchedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  completedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  cancelledAt?: Date | null;

  @Field(() => Date, { description: 'Timestamp when the booking was created.' })
  createdAt: Date;

  @Field(() => ID, { description: 'UUID of the base where the block occurs.' })
  baseId: string;

  @Field(() => String, { description: 'UUID of the organizing user (renter / booker).' })
  userId: string;

  @Field(() => ID, { description: 'Schedulable resource UUID.' })
  schedulableResourceId: string;

  @Field(() => UserType, {
    nullable: true,
    description: 'The organizing user (populated via relation).',
  })
  user?: UserType;

  @Field(() => AircraftType, {
    nullable: true,
    description: 'The aircraft when this booking targets an aircraft resource.',
  })
  aircraft?: AircraftType;

  @Field(() => SchedulableResourceType, { nullable: true })
  schedulableResource?: SchedulableResourceType;

  @Field(() => [BookingParticipantType], { nullable: true })
  participants?: BookingParticipantType[];

  @Field(() => BaseType, {
    nullable: true,
    description: 'The base where this booking occurs (populated via relation).',
  })
  base?: BaseType;
}
