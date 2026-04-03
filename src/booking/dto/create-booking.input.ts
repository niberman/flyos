// ==========================================================================
// CreateBookingInput — DTO for Creating a Flight Booking
// ==========================================================================

import { InputType, Field, ID } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsDate,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { BookingParticipantInput } from './booking-participant.input';

@InputType({ description: 'Input for creating a new flight booking.' })
export class CreateBookingInput {
  @Field(() => ID, {
    description: 'UUID of the base where the flight originates.',
  })
  @IsUUID()
  baseId: string;

  @Field(() => ID, {
    nullable: true,
    description:
      'Book by aircraft UUID; resolves to its SchedulableResource. Provide this or schedulableResourceId.',
  })
  @IsOptional()
  @IsUUID()
  aircraftId?: string;

  @Field(() => ID, {
    nullable: true,
    description:
      'Book by schedulable resource UUID. Provide this or aircraftId.',
  })
  @IsOptional()
  @IsUUID()
  schedulableResourceId?: string;

  @Field(() => [BookingParticipantInput], {
    nullable: true,
    description:
      'Additional participants (e.g. INSTRUCTOR). Renter is always the authenticated user.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingParticipantInput)
  participants?: BookingParticipantInput[];

  @Field(() => Date, {
    description: 'Start time of the booking (ISO 8601 format).',
  })
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
