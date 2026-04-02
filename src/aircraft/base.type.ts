import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('Base', {
  description: 'Home base summary for an aircraft.',
})
export class BaseType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  icaoCode: string;

  @Field(() => String)
  timezone: string;
}
