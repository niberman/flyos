import { SquawkStatus } from '@prisma/client';
export declare class SquawkType {
    id: string;
    aircraftId: string;
    title: string;
    description?: string | null;
    status: SquawkStatus;
    groundsAircraft: boolean;
    createdAt: Date;
    clearedAt?: Date | null;
}
