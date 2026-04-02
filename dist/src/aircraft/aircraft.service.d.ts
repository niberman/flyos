import { AirworthinessStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';
import { CreateAircraftInput } from './dto/create-aircraft.input';
export declare class AircraftService {
    private readonly prisma;
    private readonly tenantContext;
    constructor(prisma: PrismaService, tenantContext: TenantContext);
    private requireOrganizationId;
    create(input: CreateAircraftInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        tailNumber: string;
        make: string;
        model: string;
        airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
        homeBaseId: string;
    }>;
    findAll(homeBaseId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        tailNumber: string;
        make: string;
        model: string;
        airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
        homeBaseId: string;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        tailNumber: string;
        make: string;
        model: string;
        airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
        homeBaseId: string;
    }>;
    findByBase(baseId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        tailNumber: string;
        make: string;
        model: string;
        airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
        homeBaseId: string;
    }[]>;
    updateAirworthinessStatus(id: string, status: AirworthinessStatus): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        tailNumber: string;
        make: string;
        model: string;
        airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
        homeBaseId: string;
    }>;
}
