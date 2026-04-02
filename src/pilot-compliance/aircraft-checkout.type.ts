import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('AircraftCheckout')
export class AircraftCheckoutType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  aircraftId: string;

  @Field(() => Date)
  expiresAt: Date;
}
