// ==========================================================================
// CreateAircraftInput — DTO for Adding a New Aircraft
// ==========================================================================
// Defines the input shape for the createAircraft mutation. Only DISPATCHER
// role users can execute this mutation (enforced by RolesGuard).
// ==========================================================================

import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@InputType({ description: 'Input for adding a new aircraft to the fleet.' })
export class CreateAircraftInput {
  @Field(() => String, { description: 'FAA tail number (e.g., N12345).' })
  @IsNotEmpty()
  @IsString()
  tailNumber: string;

  @Field(() => String, { description: 'Aircraft manufacturer.' })
  @IsNotEmpty()
  @IsString()
  make: string;

  @Field(() => String, { description: 'Aircraft model designation.' })
  @IsNotEmpty()
  @IsString()
  model: string;

  @Field(() => ID, {
    description:
      'UUID of the default home base (must belong to your organization).',
  })
  @IsUUID()
  homeBaseId: string;
}
