import { BookingParticipantInput } from './booking-participant.input';
export declare class CreateBookingInput {
    baseId: string;
    aircraftId?: string;
    schedulableResourceId?: string;
    participants?: BookingParticipantInput[];
    startTime: Date;
    endTime: Date;
}
