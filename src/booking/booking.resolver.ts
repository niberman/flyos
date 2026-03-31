// ==========================================================================
// BookingResolver — GraphQL Controller for Flight Scheduling
// ==========================================================================
// This resolver is the **Controller** in the MVC pattern for booking
// operations. It handles:
//
//   1. createBooking mutation: Creates a booking with conflict resolution.
//   2. bookings query: Lists bookings (filtered by the current user's role).
//
// The resolver extracts the authenticated user's ID from the JWT and passes
// it to the service, ensuring users can only create bookings for themselves.
//
// Data Flow:
//   Client Mutation → GraphQL Engine → BookingResolver (Controller) →
//   BookingService (validates invariants) → PrismaService (Model) →
//   PostgreSQL → BookingType (View) returned to client.
//
// Access Control:
//   - createBooking: Any authenticated user can create a booking.
//   - bookings:      INSTRUCTOR and DISPATCHER can see all bookings.
// ==========================================================================

import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookingType } from './booking.type';
import { BookingService } from './booking.service';
import { CreateBookingInput } from './dto/create-booking.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Resolver(() => BookingType)
export class BookingResolver {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * Mutation: createBooking
   * Schedules a new flight booking for the authenticated user.
   *
   * The userId is automatically extracted from the JWT token via the
   * @CurrentUser() decorator — clients cannot forge the booking owner.
   *
   * Business rules enforced by BookingService:
   *   - Aircraft must be FLIGHT_READY (not GROUNDED).
   *   - Time block must not overlap with existing bookings.
   */
  @UseGuards(JwtAuthGuard)
  @Mutation(() => BookingType, {
    description:
      'Create a flight booking. Fails if aircraft is grounded or time conflicts exist.',
  })
  async createBooking(
    @CurrentUser() user: { userId: string; role: string },
    @Args('input') input: CreateBookingInput,
  ): Promise<BookingType> {
    // Delegate to the service layer, passing the authenticated user's ID.
    return this.bookingService.createBooking(user.userId, input);
  }

  /**
   * Query: bookings
   * Returns all bookings. Restricted to INSTRUCTOR and DISPATCHER roles
   * to prevent students from viewing other students' schedules.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Query(() => [BookingType], {
    description: 'List all bookings. INSTRUCTOR and DISPATCHER only.',
  })
  async bookings(): Promise<BookingType[]> {
    return this.bookingService.findAll();
  }

  /**
   * Query: myBookings
   * Returns only the bookings belonging to the authenticated user.
   * Available to any authenticated user (students can see their own bookings).
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => [BookingType], {
    description: 'List bookings for the currently authenticated user.',
  })
  async myBookings(
    @CurrentUser() user: { userId: string; role: string },
  ): Promise<BookingType[]> {
    return this.bookingService.findAll(user.userId);
  }
}
