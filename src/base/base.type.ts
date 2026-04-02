import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('Base', {
  description: 'A physical airport or flight base operated by an organization.',
})
export class BaseType {
  @Field(() => ID, { description: 'Unique identifier (UUID) for the base.' })
  id: string;

  @Field(() => String, { description: 'UUID of the organization this base belongs to.' })
  organizationId: string;

  @Field(() => String, { description: 'Name of the base.' })
  name: string;

  @Field(() => String, { description: 'ICAO airport code (e.g., KAPA, KBJC).' })
  icaoCode: string;

  @Field(() => String, { description: 'IANA timezone identifier (e.g., America/Denver).' })
  timezone: string;

  @Field(() => Date, { description: 'Timestamp when the base was created.' })
  createdAt: Date;

  @Field(() => Date, { description: 'Timestamp of the last update to the base record.' })
  updatedAt: Date;
}
