// ==========================================================================
// MaintenanceLogType — GraphQL Object Type for Maintenance Logs
// ==========================================================================
// Defines the View layer representation of a MaintenanceLog record.
// The `data` field is a JSONB column stored as GraphQL JSON scalar,
// allowing arbitrary maintenance log structures to be ingested.
// ==========================================================================

import { ObjectType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType('MaintenanceLog', {
  description: 'A maintenance log entry linked to a specific aircraft.',
})
export class MaintenanceLogType {
  @Field(() => ID, {
    description: 'Unique identifier for the maintenance log.',
  })
  id: string;

  @Field(() => String, { description: 'UUID of the associated aircraft.' })
  aircraftId: string;

  @Field(() => Date, { description: 'Timestamp of the maintenance log entry.' })
  timestamp: Date;

  @Field(() => GraphQLJSON, {
    description:
      'Raw JSONB maintenance log data as received from batch upload.',
  })
  data: any;
}
