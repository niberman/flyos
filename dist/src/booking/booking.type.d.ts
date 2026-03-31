import { UserType } from '../users/user.type';
import { AircraftType } from '../aircraft/aircraft.type';
export declare class BookingType {
    id: string;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    userId: string;
    aircraftId: string;
    user?: UserType;
    aircraft?: AircraftType;
}
