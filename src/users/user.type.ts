// ==========================================================================
// UserType — GraphQL Object Type for User
// ==========================================================================
// This class defines how a User is represented in the GraphQL schema.
// In the MVC pattern, this is the **View** layer — it determines what
// fields are visible to the client. Note that passwordHash is intentionally
// excluded to prevent leaking sensitive credential data.
//
// The @ObjectType() decorator registers this as a GraphQL type, and each
// @Field() decorator defines a field in the generated schema.
// ==========================================================================

import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Role } from '@prisma/client';

@ObjectType('User', { description: 'A registered user in the FlyOS system.' })
export class UserType {
  @Field(() => ID, { description: 'Unique identifier (UUID) for the user.' })
  id: string;

  @Field(() => String, { description: 'Email address of the user.' })
  email: string;

  // NOTE: passwordHash is deliberately NOT exposed as a GraphQL field.
  // This prevents sensitive credential data from ever reaching the client.

  @Field(() => Role, { description: 'Role determining the user\'s access level.' })
  role: string;

  @Field(() => String, { description: 'UUID of the organization this user belongs to.' })
  organizationId: string;

  @Field(() => Date, { description: 'Timestamp when the user was created.' })
  createdAt: Date;

  @Field(() => Date, { description: 'Timestamp of the last update to the user record.' })
  updatedAt: Date;
}
