import { InputType, Field, ID } from '@nestjs/graphql';
import { IsEnum, IsUUID } from 'class-validator';
import { BookingParticipantRole } from '@prisma/client';

@InputType()
export class BookingParticipantInput {
  @Field(() => ID)
  @IsUUID()
  userId: string;

  @Field(() => BookingParticipantRole)
  @IsEnum(BookingParticipantRole)
  role: BookingParticipantRole;
}
