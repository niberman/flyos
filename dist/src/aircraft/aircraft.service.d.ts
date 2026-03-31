import { AirworthinessStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAircraftInput } from './dto/create-aircraft.input';
export declare class AircraftService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(input: CreateAircraftInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tailNumber: string;
        make: string;
        model: string;
        airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tailNumber: string;
        make: string;
        model: string;
        airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tailNumber: string;
        make: string;
        model: string;
        airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
    }>;
    updateAirworthinessStatus(id: string, status: AirworthinessStatus): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tailNumber: string;
        make: string;
        model: string;
        airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
    }>;
}
