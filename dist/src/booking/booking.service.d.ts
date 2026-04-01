import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingInput } from './dto/create-booking.input';
export declare class BookingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createBooking(userId: string, input: CreateBookingInput): Promise<{
        user: {
            email: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
            passwordHash: string;
            createdAt: Date;
            updatedAt: Date;
        };
        aircraft: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tailNumber: string;
            make: string;
            model: string;
            airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        aircraftId: string;
        startTime: Date;
        endTime: Date;
    }>;
    findAll(userId?: string): Promise<({
        user: {
            email: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
            passwordHash: string;
            createdAt: Date;
            updatedAt: Date;
        };
        aircraft: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tailNumber: string;
            make: string;
            model: string;
            airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        aircraftId: string;
        startTime: Date;
        endTime: Date;
    })[]>;
    findById(id: string): Promise<({
        user: {
            email: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
            passwordHash: string;
            createdAt: Date;
            updatedAt: Date;
        };
        aircraft: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tailNumber: string;
            make: string;
            model: string;
            airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        aircraftId: string;
        startTime: Date;
        endTime: Date;
    }) | null>;
}
