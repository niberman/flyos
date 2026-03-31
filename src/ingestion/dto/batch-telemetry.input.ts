// ==========================================================================
// BatchTelemetryInput — DTO for Batch Telemetry Data Upload
// ==========================================================================
// This DTO defines the shape of a batch telemetry upload request.
// Each entry contains an aircraftId and raw JSONB sensor data including
// fields like oilPressure and cylinderHeadTemperature.
//
// The ingestion service parses this array and creates one Telemetry record
// per entry. These records are later scanned by the predictive maintenance
// cron job to detect threshold violations.
// ==========================================================================

import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsDateString } from 'class-validator';
import { GraphQLJSON } from 'graphql-type-json';

@InputType({
  description: 'A single telemetry data entry within a batch upload.',
})
export class TelemetryEntry {
  @Field(() => String, { description: 'UUID of the target aircraft.' })
  @IsUUID()
  aircraftId: string;

  @Field(() => Date, {
    nullable: true,
    description: 'Timestamp of the sensor reading. Defaults to now if omitted.',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: Date;

  @Field(() => GraphQLJSON, {
    description:
      'Raw sensor data (e.g., { oilPressure: 45, cylinderHeadTemperature: 380 }).',
  })
  data: any;
}

@InputType({ description: 'Input for batch uploading telemetry records.' })
export class BatchTelemetryInput {
  @Field(() => [TelemetryEntry], {
    description: 'Array of telemetry data entries to ingest.',
  })
  entries: TelemetryEntry[];
}
