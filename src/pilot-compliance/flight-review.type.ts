import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('FlightReviewRecord')
export class FlightReviewType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => Date)
  completedAt: Date;

  @Field(() => Date)
  expiresAt: Date;
}
