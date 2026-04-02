import { IngestionService } from './ingestion.service';
import { MaintenanceLogType } from './maintenance-log.type';
import { TelemetryType } from './telemetry.type';
import { BatchMaintenanceInput } from './dto/batch-maintenance.input';
import { BatchTelemetryInput } from './dto/batch-telemetry.input';
import { PrismaService } from '../prisma/prisma.service';
export declare class IngestionResolver {
    private readonly ingestionService;
    private readonly prisma;
    constructor(ingestionService: IngestionService, prisma: PrismaService);
    private organizationIdForUser;
    ingestMaintenanceLogs(user: {
        userId: string;
        role: string;
    }, input: BatchMaintenanceInput): Promise<MaintenanceLogType[]>;
    ingestTelemetry(user: {
        userId: string;
        role: string;
    }, input: BatchTelemetryInput): Promise<TelemetryType[]>;
}
