import { PrismaService } from '../prisma/prisma.service';
import { BatchMaintenanceInput } from './dto/batch-maintenance.input';
import { BatchTelemetryInput } from './dto/batch-telemetry.input';
export declare class IngestionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    ingestMaintenanceLogs(input: BatchMaintenanceInput, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        timestamp: Date;
        data: import(".prisma/client/runtime/client").JsonValue;
        aircraftId: string;
    }[]>;
    ingestTelemetry(input: BatchTelemetryInput, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        timestamp: Date;
        data: import(".prisma/client/runtime/client").JsonValue;
        aircraftId: string;
    }[]>;
}
