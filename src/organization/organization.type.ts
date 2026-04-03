import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('Organization', {
  description: 'A flight school or operator in the FlyOS system.',
})
export class OrganizationType {
  @Field(() => ID, {
    description: 'Unique identifier (UUID) for the organization.',
  })
  id: string;

  @Field(() => String, { description: 'Name of the organization.' })
  name: string;

  @Field(() => String, {
    description: 'URL-safe slug for subdomain or URL routing.',
  })
  slug: string;

  @Field(() => Date, {
    description: 'Timestamp when the organization was created.',
  })
  createdAt: Date;

  @Field(() => Date, {
    description: 'Timestamp of the last update to the organization record.',
  })
  updatedAt: Date;
}
