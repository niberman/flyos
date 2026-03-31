// ==========================================================================
// LoginInput — Data Transfer Object for User Login
// ==========================================================================
// This DTO defines the expected shape of a login request. The GraphQL
// code-first engine uses the @InputType() and @Field() decorators to
// generate the corresponding GraphQL input type in the schema.
// ==========================================================================

import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@InputType({ description: 'Input for authenticating an existing user.' })
export class LoginInput {
  @Field(() => String, { description: 'Email address of the account.' })
  @IsEmail()
  email: string;

  @Field(() => String, { description: 'Account password.' })
  @MinLength(8)
  password: string;
}
