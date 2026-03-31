import { IngestionService } from './ingestion.service';
import { MaintenanceLogType } from './maintenance-log.type';
import { TelemetryType } from './telemetry.type';
import { BatchMaintenanceInput } from './dto/batch-maintenance.input';
import { BatchTelemetryInput } from './dto/batch-telemetry.input';
export declare class IngestionResolver {
    private readonly ingestionService;
    constructor(ingestionService: IngestionService);
    ingestMaintenanceLogs(input: BatchMaintenanceInput): Promise<MaintenanceLogType[]>;
    ingestTelemetry(input: BatchTelemetryInput): Promise<TelemetryType[]>;
}
