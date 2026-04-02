import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { SquawkStatus } from '@prisma/client';

registerEnumType(SquawkStatus, {
  name: 'SquawkStatus',
  description: 'Lifecycle of a maintenance squawk.',
});

@ObjectType('Squawk')
export class SquawkType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  aircraftId: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => SquawkStatus)
  status: SquawkStatus;

  @Field(() => Boolean)
  groundsAircraft: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  clearedAt?: Date | null;
}
