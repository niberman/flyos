import { BookingParticipantRole } from '@prisma/client';
import { UserType } from '../users/user.type';
export declare class BookingParticipantType {
    id: string;
    userId: string;
    role: BookingParticipantRole;
    user?: UserType;
}
