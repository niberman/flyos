import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

@InputType({ description: 'Input for creating a new base in your organization.' })
export class CreateBaseInput {
  @Field(() => String, { description: 'Display name of the base.' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field(() => String, {
    description: 'ICAO airport code (e.g., KAPA). Must be unique per organization.',
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 4)
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'icaoCode must be 3–4 alphanumeric characters.',
  })
  icaoCode: string;

  @Field(() => String, {
    description: 'IANA timezone (e.g., America/Denver).',
  })
  @IsNotEmpty()
  @IsString()
  timezone: string;
}
