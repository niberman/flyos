import { AirworthinessStatus } from '@prisma/client';
import { BaseType } from '../base/base.type';
export declare class AircraftType {
    id: string;
    tailNumber: string;
    make: string;
    model: string;
    airworthinessStatus: AirworthinessStatus;
    organizationId: string;
    homeBaseId: string;
    homeBase?: BaseType;
    createdAt: Date;
    updatedAt: Date;
}
