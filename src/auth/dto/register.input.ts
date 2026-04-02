// ==========================================================================
// RegisterInput — Data Transfer Object for User Registration
// ==========================================================================
// DTOs (Data Transfer Objects) define the shape of data flowing into the
// application from the client. In the MVC pattern, DTOs act as the contract
// between the View (GraphQL schema) and the Controller (Resolver).
//
// The @InputType() decorator tells the code-first GraphQL schema generator
// to create a corresponding GraphQL input type. The class-validator
// decorators (@IsEmail, @MinLength) provide server-side validation before
// the data reaches the business logic layer.
// ==========================================================================

import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsEmail, MinLength, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';

// Register the Prisma Role enum with GraphQL so it appears in the schema
// as a proper GraphQL enum type rather than a plain string.
registerEnumType(Role, {
  name: 'Role',
  description: 'User role determining access level within the system.',
});

@InputType({ description: 'Input for registering a new user account.' })
export class RegisterInput {
  @Field(() => String, { description: 'Unique email address for the account.' })
  @IsEmail({}, { message: 'A valid email address is required.' })
  email: string;

  @Field(() => String, { description: 'Password (minimum 8 characters).' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;

  @Field(() => Role, {
    nullable: true,
    defaultValue: Role.STUDENT,
    description:
      'Role assigned to the user. Defaults to STUDENT if not specified.',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @Field(() => String, { description: 'UUID of the organization the user belongs to.' })
  @IsUUID()
  organizationId: string;
}
