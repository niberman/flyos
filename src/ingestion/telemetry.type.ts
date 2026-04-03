// ==========================================================================
// TelemetryType — GraphQL Object Type for Telemetry Records
// ==========================================================================
// Defines the View layer representation of a Telemetry record.
// The `data` field is a JSONB column that stores raw sensor readings
// including oil pressure (PSI) and cylinder head temperature (°F).
//
// These records are scanned by the predictive maintenance cron job to
// detect unsafe conditions and automatically ground aircraft.
// ==========================================================================

import { ObjectType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType('Telemetry', {
  description:
    'A telemetry data point containing sensor readings for an aircraft.',
})
export class TelemetryType {
  @Field(() => ID, {
    description: 'Unique identifier for the telemetry record.',
  })
  id: string;

  @Field(() => String, { description: 'UUID of the associated aircraft.' })
  aircraftId: string;

  @Field(() => Date, {
    description: 'Timestamp when the sensor data was recorded.',
  })
  timestamp: Date;

  @Field(() => GraphQLJSON, {
    description:
      'Raw JSONB sensor data (e.g., { oilPressure: 45, cylinderHeadTemperature: 380 }).',
  })
  data: any;
}
