import { UserType } from '../users/user.type';
import { AircraftType } from '../aircraft/aircraft.type';
import { BaseType } from '../base/base.type';
export declare class BookingType {
    id: string;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    baseId: string;
    userId: string;
    aircraftId: string;
    user?: UserType;
    aircraft?: AircraftType;
    base?: BaseType;
}
