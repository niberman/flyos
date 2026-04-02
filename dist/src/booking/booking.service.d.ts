import { Role } from '@prisma/client';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingInput } from './dto/create-booking.input';
export interface BookingDateRange {
    startDate?: Date;
    endDate?: Date;
}
export declare class BookingService {
    private readonly prisma;
    private readonly pubSub;
    constructor(prisma: PrismaService, pubSub: PubSub);
    private buildDateRangeWhere;
    private publishBookingUpdated;
    createBooking(userId: string, organizationId: string, input: CreateBookingInput): Promise<{
        aircraft: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            tailNumber: string;
            make: string;
            model: string;
            airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
            homeBaseId: string;
        };
        base: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            icaoCode: string;
            timezone: string;
        };
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            email: string;
            passwordHash: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        aircraftId: string;
        startTime: Date;
        endTime: Date;
    }>;
    findAll(organizationId: string, baseId?: string): Promise<({
        aircraft: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            tailNumber: string;
            make: string;
            model: string;
            airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
            homeBaseId: string;
        };
        base: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            icaoCode: string;
            timezone: string;
        };
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            email: string;
            passwordHash: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        aircraftId: string;
        startTime: Date;
        endTime: Date;
    })[]>;
    findByBase(organizationId: string, baseId: string, dateRange?: BookingDateRange): Promise<({
        aircraft: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            tailNumber: string;
            make: string;
            model: string;
            airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
            homeBaseId: string;
        };
        base: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            icaoCode: string;
            timezone: string;
        };
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            email: string;
            passwordHash: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        aircraftId: string;
        startTime: Date;
        endTime: Date;
    })[]>;
    findByAircraft(organizationId: string, aircraftId: string, dateRange?: BookingDateRange): Promise<({
        aircraft: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            tailNumber: string;
            make: string;
            model: string;
            airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
            homeBaseId: string;
        };
        base: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            icaoCode: string;
            timezone: string;
        };
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            email: string;
            passwordHash: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        aircraftId: string;
        startTime: Date;
        endTime: Date;
    })[]>;
    myBookings(userId: string, organizationId: string, baseId?: string): Promise<({
        aircraft: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            tailNumber: string;
            make: string;
            model: string;
            airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
            homeBaseId: string;
        };
        base: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            icaoCode: string;
            timezone: string;
        };
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            email: string;
            passwordHash: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        aircraftId: string;
        startTime: Date;
        endTime: Date;
    })[]>;
    findById(id: string): Promise<({
        aircraft: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            tailNumber: string;
            make: string;
            model: string;
            airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
            homeBaseId: string;
        };
        base: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            icaoCode: string;
            timezone: string;
        };
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            email: string;
            passwordHash: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        aircraftId: string;
        startTime: Date;
        endTime: Date;
    }) | null>;
    cancelBooking(bookingId: string, userId: string, role: Role, organizationId: string): Promise<boolean>;
}
