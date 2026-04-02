import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { BookingParticipantRole } from '@prisma/client';
import { UserType } from '../users/user.type';

registerEnumType(BookingParticipantRole, {
  name: 'BookingParticipantRole',
  description: 'Role of a user on a booking (renter or instructor).',
});

@ObjectType('BookingParticipant')
export class BookingParticipantType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => BookingParticipantRole)
  role: BookingParticipantRole;

  @Field(() => UserType, { nullable: true })
  user?: UserType;
}
