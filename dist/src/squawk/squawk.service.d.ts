import { SquawkStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class SquawkService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createSquawk(organizationId: string, data: {
        aircraftId: string;
        title: string;
        description?: string | null;
        groundsAircraft?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        organizationId: string;
        aircraftId: string;
        status: import("@prisma/client").$Enums.SquawkStatus;
        title: string;
        description: string | null;
        groundsAircraft: boolean;
        clearedAt: Date | null;
    }>;
    updateSquawkStatus(organizationId: string, squawkId: string, status: SquawkStatus): Promise<{
        id: string;
        createdAt: Date;
        organizationId: string;
        aircraftId: string;
        status: import("@prisma/client").$Enums.SquawkStatus;
        title: string;
        description: string | null;
        groundsAircraft: boolean;
        clearedAt: Date | null;
    }>;
    listForOrganization(organizationId: string, aircraftId?: string): Promise<{
        id: string;
        createdAt: Date;
        organizationId: string;
        aircraftId: string;
        status: import("@prisma/client").$Enums.SquawkStatus;
        title: string;
        description: string | null;
        groundsAircraft: boolean;
        clearedAt: Date | null;
    }[]>;
    reconcileAircraftAirworthiness(aircraftId: string): Promise<void>;
    hasOpenGroundingSquawk(aircraftId: string): Promise<boolean>;
}
