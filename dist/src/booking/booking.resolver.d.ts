import { BookingType } from './booking.type';
import { BookingService } from './booking.service';
import { CreateBookingInput } from './dto/create-booking.input';
export declare class BookingResolver {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createBooking(user: {
        userId: string;
        role: string;
    }, input: CreateBookingInput): Promise<BookingType>;
    bookings(): Promise<BookingType[]>;
    myBookings(user: {
        userId: string;
        role: string;
    }): Promise<BookingType[]>;
}
