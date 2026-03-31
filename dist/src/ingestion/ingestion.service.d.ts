import { PrismaService } from '../prisma/prisma.service';
import { BatchMaintenanceInput } from './dto/batch-maintenance.input';
import { BatchTelemetryInput } from './dto/batch-telemetry.input';
export declare class IngestionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    ingestMaintenanceLogs(input: BatchMaintenanceInput): Promise<{
        id: string;
        data: import(".prisma/client/runtime/client").JsonValue;
        aircraftId: string;
        timestamp: Date;
    }[]>;
    ingestTelemetry(input: BatchTelemetryInput): Promise<{
        id: string;
        data: import(".prisma/client/runtime/client").JsonValue;
        aircraftId: string;
        timestamp: Date;
    }[]>;
}
