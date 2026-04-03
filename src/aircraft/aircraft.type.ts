// ==========================================================================
// AircraftType — GraphQL Object Type for Aircraft
// ==========================================================================
// Defines the **View** layer representation of an Aircraft entity in the
// GraphQL schema. This type is what clients receive when querying aircraft
// data. The AirworthinessStatus enum is registered here for GraphQL use.
// ==========================================================================

import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { AirworthinessStatus } from '@prisma/client';
import { BaseType } from '../base/base.type';

// Register the Prisma AirworthinessStatus enum with GraphQL so it can be
// used as a field type and input argument in the schema.
registerEnumType(AirworthinessStatus, {
  name: 'AirworthinessStatus',
  description:
    'Indicates whether an aircraft is cleared for flight operations.',
});

@ObjectType('Aircraft', {
  description: 'An aircraft in the flight school fleet.',
})
export class AircraftType {
  @Field(() => ID, {
    description: 'Unique identifier (UUID) for the aircraft.',
  })
  id: string;

  @Field(() => String, {
    description:
      'FAA tail number uniquely identifying the aircraft (e.g., N12345).',
  })
  tailNumber: string;

  @Field(() => String, {
    description: 'Aircraft manufacturer (e.g., Cessna, Piper).',
  })
  make: string;

  @Field(() => String, {
    description: 'Aircraft model (e.g., 172 Skyhawk, PA-28 Cherokee).',
  })
  model: string;

  @Field(() => AirworthinessStatus, {
    description:
      'Current airworthiness status. Automatically set to GROUNDED by the predictive maintenance engine when telemetry thresholds are violated.',
  })
  airworthinessStatus: AirworthinessStatus;

  @Field(() => ID, {
    description: 'UUID of the organization this aircraft belongs to.',
  })
  organizationId: string;

  @Field(() => ID, {
    description: 'UUID of the default home base for this aircraft.',
  })
  homeBaseId: string;

  @Field(() => BaseType, {
    description: 'The aircraft home base.',
  })
  homeBase?: BaseType;

  @Field(() => Date, {
    description: 'Timestamp when the aircraft record was created.',
  })
  createdAt: Date;

  @Field(() => Date, {
    description: 'Timestamp of the last update to the aircraft record.',
  })
  updatedAt: Date;
}
