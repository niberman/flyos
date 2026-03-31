// ==========================================================================
// IngestionModule — Feature Module for Data Ingestion
// ==========================================================================
// Encapsulates the batch data ingestion resolver and service for
// maintenance logs and telemetry records.
// ==========================================================================

import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionResolver } from './ingestion.resolver';

@Module({
  providers: [IngestionService, IngestionResolver],
  exports: [IngestionService],
})
export class IngestionModule {}
