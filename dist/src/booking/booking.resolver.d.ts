import { PubSub } from 'graphql-subscriptions';
import { BookingType } from './booking.type';
import { BookingService } from './booking.service';
import { CreateBookingInput } from './dto/create-booking.input';
import { DispatchBookingInput } from './dto/dispatch-booking.input';
import { CompleteBookingInput } from './dto/complete-booking.input';
import { PrismaService } from '../prisma/prisma.service';
import { AircraftType } from '../aircraft/aircraft.type';
import { SchedulableResourceType } from './schedulable-resource.type';
export declare class BookingResolver {
    private readonly bookingService;
    private readonly prisma;
    private readonly pubSub;
    constructor(bookingService: BookingService, prisma: PrismaService, pubSub: PubSub);
    aircraft(booking: {
        schedulableResource?: {
            aircraft?: AircraftType | null;
        } | null;
    }): AircraftType | null;
    schedulableResource(booking: {
        schedulableResource?: SchedulableResourceType | null;
    }): SchedulableResourceType | null;
    aircraftId(booking: {
        schedulableResource?: {
            aircraftId?: string | null;
        } | null;
    }): string | null;
    hobbsOut(booking: {
        hobbsOut?: {
            toString(): string;
        } | null;
    }): number | null;
    hobbsIn(booking: {
        hobbsIn?: {
            toString(): string;
        } | null;
    }): number | null;
    tachOut(booking: {
        tachOut?: {
            toString(): string;
        } | null;
    }): number | null;
    tachIn(booking: {
        tachIn?: {
            toString(): string;
        } | null;
    }): number | null;
    private requireOrganizationId;
    createBooking(user: {
        userId: string;
        role: string;
    }, input: CreateBookingInput): Promise<BookingType>;
    bookings(user: {
        userId: string;
        role: string;
    }, baseId?: string): Promise<BookingType[]>;
    myBookings(user: {
        userId: string;
        role: string;
    }, baseId?: string): Promise<BookingType[]>;
    bookingsByBase(user: {
        userId: string;
        role: string;
    }, baseId: string, startDate?: Date, endDate?: Date): Promise<BookingType[]>;
    bookingsByAircraft(user: {
        userId: string;
        role: string;
    }, aircraftId: string, startDate?: Date, endDate?: Date): Promise<BookingType[]>;
    dispatchBooking(user: {
        userId: string;
        role: string;
    }, input: DispatchBookingInput): Promise<BookingType>;
    completeBooking(user: {
        userId: string;
        role: string;
    }, input: CompleteBookingInput): Promise<BookingType>;
    cancelBooking(user: {
        userId: string;
        role: string;
    }, bookingId: string): Promise<boolean>;
    bookingUpdated(): AsyncIterator<unknown, any, any>;
}
