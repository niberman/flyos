import { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingInput } from './dto/create-booking.input';
import { PilotComplianceService } from '../pilot-compliance/pilot-compliance.service';
export interface BookingDateRange {
    startDate?: Date;
    endDate?: Date;
}
export declare class BookingService {
    private readonly prisma;
    private readonly pilotCompliance;
    private readonly pubSub;
    constructor(prisma: PrismaService, pilotCompliance: PilotComplianceService, pubSub: PubSub);
    private buildDateRangeWhere;
    private notCancelledWhere;
    private publishBookingUpdated;
    private resolveSchedulableResource;
    createBooking(userId: string, organizationId: string, input: CreateBookingInput): Promise<{
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
        schedulableResource: {
            aircraft: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                tailNumber: string;
                make: string;
                model: string;
                airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
                hobbsHours: Prisma.Decimal;
                tachHours: Prisma.Decimal;
                homeBaseId: string;
            } | null;
        } & {
            id: string;
            name: string;
            organizationId: string;
            baseId: string;
            aircraftId: string | null;
            kind: import("@prisma/client").$Enums.SchedulableResourceKind;
            isActive: boolean;
        };
        participants: ({
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
            organizationId: string;
            role: import("@prisma/client").$Enums.BookingParticipantRole;
            userId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        completedAt: Date | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        startTime: Date;
        endTime: Date;
        dispatchedAt: Date | null;
        cancelledAt: Date | null;
        hobbsOut: Prisma.Decimal | null;
        hobbsIn: Prisma.Decimal | null;
        tachOut: Prisma.Decimal | null;
        tachIn: Prisma.Decimal | null;
        schedulableResourceId: string;
    }>;
    findAll(organizationId: string, baseId?: string): Promise<({
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
        schedulableResource: {
            aircraft: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                tailNumber: string;
                make: string;
                model: string;
                airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
                hobbsHours: Prisma.Decimal;
                tachHours: Prisma.Decimal;
                homeBaseId: string;
            } | null;
        } & {
            id: string;
            name: string;
            organizationId: string;
            baseId: string;
            aircraftId: string | null;
            kind: import("@prisma/client").$Enums.SchedulableResourceKind;
            isActive: boolean;
        };
        participants: ({
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
            organizationId: string;
            role: import("@prisma/client").$Enums.BookingParticipantRole;
            userId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        completedAt: Date | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        startTime: Date;
        endTime: Date;
        dispatchedAt: Date | null;
        cancelledAt: Date | null;
        hobbsOut: Prisma.Decimal | null;
        hobbsIn: Prisma.Decimal | null;
        tachOut: Prisma.Decimal | null;
        tachIn: Prisma.Decimal | null;
        schedulableResourceId: string;
    })[]>;
    findByBase(organizationId: string, baseId: string, dateRange?: BookingDateRange): Promise<({
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
        schedulableResource: {
            aircraft: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                tailNumber: string;
                make: string;
                model: string;
                airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
                hobbsHours: Prisma.Decimal;
                tachHours: Prisma.Decimal;
                homeBaseId: string;
            } | null;
        } & {
            id: string;
            name: string;
            organizationId: string;
            baseId: string;
            aircraftId: string | null;
            kind: import("@prisma/client").$Enums.SchedulableResourceKind;
            isActive: boolean;
        };
        participants: ({
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
            organizationId: string;
            role: import("@prisma/client").$Enums.BookingParticipantRole;
            userId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        completedAt: Date | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        startTime: Date;
        endTime: Date;
        dispatchedAt: Date | null;
        cancelledAt: Date | null;
        hobbsOut: Prisma.Decimal | null;
        hobbsIn: Prisma.Decimal | null;
        tachOut: Prisma.Decimal | null;
        tachIn: Prisma.Decimal | null;
        schedulableResourceId: string;
    })[]>;
    findByAircraft(organizationId: string, aircraftId: string, dateRange?: BookingDateRange): Promise<({
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
        schedulableResource: {
            aircraft: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                tailNumber: string;
                make: string;
                model: string;
                airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
                hobbsHours: Prisma.Decimal;
                tachHours: Prisma.Decimal;
                homeBaseId: string;
            } | null;
        } & {
            id: string;
            name: string;
            organizationId: string;
            baseId: string;
            aircraftId: string | null;
            kind: import("@prisma/client").$Enums.SchedulableResourceKind;
            isActive: boolean;
        };
        participants: ({
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
            organizationId: string;
            role: import("@prisma/client").$Enums.BookingParticipantRole;
            userId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        completedAt: Date | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        startTime: Date;
        endTime: Date;
        dispatchedAt: Date | null;
        cancelledAt: Date | null;
        hobbsOut: Prisma.Decimal | null;
        hobbsIn: Prisma.Decimal | null;
        tachOut: Prisma.Decimal | null;
        tachIn: Prisma.Decimal | null;
        schedulableResourceId: string;
    })[]>;
    findBySchedulableResource(organizationId: string, schedulableResourceId: string, dateRange?: BookingDateRange): Promise<({
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
        schedulableResource: {
            aircraft: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                tailNumber: string;
                make: string;
                model: string;
                airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
                hobbsHours: Prisma.Decimal;
                tachHours: Prisma.Decimal;
                homeBaseId: string;
            } | null;
        } & {
            id: string;
            name: string;
            organizationId: string;
            baseId: string;
            aircraftId: string | null;
            kind: import("@prisma/client").$Enums.SchedulableResourceKind;
            isActive: boolean;
        };
        participants: ({
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
            organizationId: string;
            role: import("@prisma/client").$Enums.BookingParticipantRole;
            userId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        completedAt: Date | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        startTime: Date;
        endTime: Date;
        dispatchedAt: Date | null;
        cancelledAt: Date | null;
        hobbsOut: Prisma.Decimal | null;
        hobbsIn: Prisma.Decimal | null;
        tachOut: Prisma.Decimal | null;
        tachIn: Prisma.Decimal | null;
        schedulableResourceId: string;
    })[]>;
    myBookings(userId: string, organizationId: string, baseId?: string): Promise<({
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
        schedulableResource: {
            aircraft: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                tailNumber: string;
                make: string;
                model: string;
                airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
                hobbsHours: Prisma.Decimal;
                tachHours: Prisma.Decimal;
                homeBaseId: string;
            } | null;
        } & {
            id: string;
            name: string;
            organizationId: string;
            baseId: string;
            aircraftId: string | null;
            kind: import("@prisma/client").$Enums.SchedulableResourceKind;
            isActive: boolean;
        };
        participants: ({
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
            organizationId: string;
            role: import("@prisma/client").$Enums.BookingParticipantRole;
            userId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        completedAt: Date | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        startTime: Date;
        endTime: Date;
        dispatchedAt: Date | null;
        cancelledAt: Date | null;
        hobbsOut: Prisma.Decimal | null;
        hobbsIn: Prisma.Decimal | null;
        tachOut: Prisma.Decimal | null;
        tachIn: Prisma.Decimal | null;
        schedulableResourceId: string;
    })[]>;
    findById(id: string): Promise<({
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
        schedulableResource: {
            aircraft: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                tailNumber: string;
                make: string;
                model: string;
                airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
                hobbsHours: Prisma.Decimal;
                tachHours: Prisma.Decimal;
                homeBaseId: string;
            } | null;
        } & {
            id: string;
            name: string;
            organizationId: string;
            baseId: string;
            aircraftId: string | null;
            kind: import("@prisma/client").$Enums.SchedulableResourceKind;
            isActive: boolean;
        };
        participants: ({
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
            organizationId: string;
            role: import("@prisma/client").$Enums.BookingParticipantRole;
            userId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        completedAt: Date | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        startTime: Date;
        endTime: Date;
        dispatchedAt: Date | null;
        cancelledAt: Date | null;
        hobbsOut: Prisma.Decimal | null;
        hobbsIn: Prisma.Decimal | null;
        tachOut: Prisma.Decimal | null;
        tachIn: Prisma.Decimal | null;
        schedulableResourceId: string;
    }) | null>;
    dispatchBooking(bookingId: string, actorUserId: string, role: Role, organizationId: string, hobbsOut?: number, tachOut?: number): Promise<{
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
        schedulableResource: {
            aircraft: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                tailNumber: string;
                make: string;
                model: string;
                airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
                hobbsHours: Prisma.Decimal;
                tachHours: Prisma.Decimal;
                homeBaseId: string;
            } | null;
        } & {
            id: string;
            name: string;
            organizationId: string;
            baseId: string;
            aircraftId: string | null;
            kind: import("@prisma/client").$Enums.SchedulableResourceKind;
            isActive: boolean;
        };
        participants: ({
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
            organizationId: string;
            role: import("@prisma/client").$Enums.BookingParticipantRole;
            userId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        completedAt: Date | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        startTime: Date;
        endTime: Date;
        dispatchedAt: Date | null;
        cancelledAt: Date | null;
        hobbsOut: Prisma.Decimal | null;
        hobbsIn: Prisma.Decimal | null;
        tachOut: Prisma.Decimal | null;
        tachIn: Prisma.Decimal | null;
        schedulableResourceId: string;
    }>;
    completeBooking(bookingId: string, actorUserId: string, role: Role, organizationId: string, hobbsIn?: number, tachIn?: number): Promise<{
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
        schedulableResource: {
            aircraft: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                tailNumber: string;
                make: string;
                model: string;
                airworthinessStatus: import("@prisma/client").$Enums.AirworthinessStatus;
                hobbsHours: Prisma.Decimal;
                tachHours: Prisma.Decimal;
                homeBaseId: string;
            } | null;
        } & {
            id: string;
            name: string;
            organizationId: string;
            baseId: string;
            aircraftId: string | null;
            kind: import("@prisma/client").$Enums.SchedulableResourceKind;
            isActive: boolean;
        };
        participants: ({
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
            organizationId: string;
            role: import("@prisma/client").$Enums.BookingParticipantRole;
            userId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        baseId: string;
        completedAt: Date | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        startTime: Date;
        endTime: Date;
        dispatchedAt: Date | null;
        cancelledAt: Date | null;
        hobbsOut: Prisma.Decimal | null;
        hobbsIn: Prisma.Decimal | null;
        tachOut: Prisma.Decimal | null;
        tachIn: Prisma.Decimal | null;
        schedulableResourceId: string;
    }>;
    cancelBooking(bookingId: string, userId: string, role: Role, organizationId: string): Promise<boolean>;
}
