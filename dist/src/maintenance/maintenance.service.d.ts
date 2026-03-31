import { PrismaService } from '../prisma/prisma.service';
export declare class MaintenanceService {
    private readonly prisma;
    private static readonly MAX_CYLINDER_HEAD_TEMP;
    private static readonly MIN_OIL_PRESSURE;
    private readonly logger;
    constructor(prisma: PrismaService);
    checkTelemetryThresholds(): Promise<void>;
}
