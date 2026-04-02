import { SchedulableResourceKind } from '@prisma/client';
import { AircraftType } from '../aircraft/aircraft.type';
export declare class SchedulableResourceType {
    id: string;
    kind: SchedulableResourceKind;
    name: string;
    isActive: boolean;
    baseId: string;
    aircraft?: AircraftType | null;
}
