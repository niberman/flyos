// ==========================================================================
// CreateAircraftInput — DTO for Adding a New Aircraft
// ==========================================================================
// Defines the input shape for the createAircraft mutation. Only DISPATCHER
// role users can execute this mutation (enforced by RolesGuard).
// ==========================================================================

import { InputType, Field } from '@nestjs/graphql';
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

  @Field(() => String, { description: 'UUID of the organization this aircraft belongs to.' })
  @IsUUID()
  organizationId: string;

  @Field(() => String, { description: 'UUID of the default home base.' })
  @IsUUID()
  homeBaseId: string;
}
