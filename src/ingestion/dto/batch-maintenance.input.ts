// ==========================================================================
// BatchMaintenanceInput — DTO for Batch Maintenance Log Upload
// ==========================================================================
// This DTO defines the shape of a batch maintenance log upload request.
// Each entry in the batch contains an aircraftId and raw JSONB log data.
// The ingestion service parses this array and creates one MaintenanceLog
// record per entry, linking each to the correct Aircraft ID.
// ==========================================================================

import { InputType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsDate,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-type-json';

@InputType({
  description:
    'A single maintenance log entry within a batch upload. Aircraft must belong to the caller organization.',
})
export class MaintenanceLogEntry {
  @Field(() => String, { description: 'UUID of the target aircraft.' })
  @IsUUID()
  aircraftId: string;

  @Field(() => Date, {
    nullable: true,
    description: 'Timestamp of the log entry. Defaults to now if omitted.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  timestamp?: Date;

  @Field(() => GraphQLJSON, {
    description: 'Raw maintenance log data (arbitrary JSON structure).',
  })
  @Allow()
  data: any;
}

@InputType({ description: 'Input for batch uploading maintenance log records.' })
export class BatchMaintenanceInput {
  @Field(() => [MaintenanceLogEntry], {
    description: 'Array of maintenance log entries to ingest.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenanceLogEntry)
  entries: MaintenanceLogEntry[];
}
