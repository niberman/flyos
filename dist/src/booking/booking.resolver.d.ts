import { PubSub } from 'graphql-subscriptions';
import { BookingType } from './booking.type';
import { BookingService } from './booking.service';
import { CreateBookingInput } from './dto/create-booking.input';
import { PrismaService } from '../prisma/prisma.service';
export declare class BookingResolver {
    private readonly bookingService;
    private readonly prisma;
    private readonly pubSub;
    constructor(bookingService: BookingService, prisma: PrismaService, pubSub: PubSub);
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
    cancelBooking(user: {
        userId: string;
        role: string;
    }, bookingId: string): Promise<boolean>;
    bookingUpdated(): AsyncIterator<unknown, any, any>;
}
