import { MaintenanceService } from './maintenance.service';
import { Alert } from './alert.type';
import { PrismaService } from '../prisma/prisma.service';
export declare class MaintenanceResolver {
    private readonly maintenanceService;
    private readonly prisma;
    constructor(maintenanceService: MaintenanceService, prisma: PrismaService);
    alertHistory(user: {
        userId: string;
    }, aircraftId?: string, hours?: number): Promise<Alert[]>;
}
