import { AirworthinessStatus } from '@prisma/client';
export declare class AircraftType {
    id: string;
    tailNumber: string;
    make: string;
    model: string;
    airworthinessStatus: AirworthinessStatus;
    createdAt: Date;
    updatedAt: Date;
}
