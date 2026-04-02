import { PrismaService } from '../prisma/prisma.service';
import { Alert } from './alert.type';
export declare class MaintenanceService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    checkTelemetryThresholds(): Promise<void>;
    private processOrgTelemetryWindow;
    getAlertHistory(organizationId: string, aircraftId?: string, hours?: number): Promise<Alert[]>;
}
