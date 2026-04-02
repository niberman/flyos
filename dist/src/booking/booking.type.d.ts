import { BookingStatus } from '@prisma/client';
import { UserType } from '../users/user.type';
import { AircraftType } from '../aircraft/aircraft.type';
import { BaseType } from '../base/base.type';
import { SchedulableResourceType } from './schedulable-resource.type';
import { BookingParticipantType } from './booking-participant.type';
export declare class BookingType {
    id: string;
    startTime: Date;
    endTime: Date;
    status: BookingStatus;
    dispatchedAt?: Date | null;
    completedAt?: Date | null;
    cancelledAt?: Date | null;
    createdAt: Date;
    baseId: string;
    userId: string;
    schedulableResourceId: string;
    user?: UserType;
    aircraft?: AircraftType;
    schedulableResource?: SchedulableResourceType;
    participants?: BookingParticipantType[];
    base?: BaseType;
}
