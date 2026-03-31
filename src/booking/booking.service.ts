// ==========================================================================
// BookingService — Business Logic for Flight Scheduling
// ==========================================================================
// This service implements the core scheduling logic with two critical
// safety invariants:
//
//   1. OVERLAP PREVENTION: A booking cannot be created if the requested
//      time block overlaps with an existing booking for the same aircraft.
//      This prevents double-booking and ensures flight safety.
//
//   2. AIRWORTHINESS CHECK: A booking cannot be created if the target
//      aircraft has been grounded (AirworthinessStatus = GROUNDED).
//      This prevents scheduling flights on unsafe aircraft.
//
// In the MVC pattern, this service is the business logic layer between
// the Controller (BookingResolver) and the Model (PrismaService).
//
// Data Flow:
//   BookingResolver → BookingService (validates constraints) →
//   PrismaService (queries/writes) → PostgreSQL
//
// Conflict Resolution Algorithm:
//   Two time intervals [A_start, A_end] and [B_start, B_end] overlap if
//   and only if: A_start < B_end AND A_end > B_start.
//   This is checked using a Prisma query with compound conditions.
// ==========================================================================

import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AirworthinessStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingInput } from './dto/create-booking.input';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new flight booking after validating both safety invariants.
   *
   * Algorithm:
   *   1. Fetch the target aircraft and verify it is FLIGHT_READY.
   *   2. Query for any existing bookings that overlap with the requested
   *      time block using the interval overlap formula.
   *   3. If both checks pass, create and return the new booking.
   *
   * @param userId - UUID of the authenticated user (from JWT).
   * @param input  - CreateBookingInput with aircraftId, startTime, endTime.
   * @returns The created Booking record with user and aircraft relations.
   * @throws BadRequestException if the aircraft is GROUNDED.
   * @throws ConflictException if the time block overlaps an existing booking.
   */
  async createBooking(userId: string, input: CreateBookingInput) {
    // ---- INVARIANT 1: Airworthiness Check ----
    // Fetch the aircraft from the database (Model layer) and verify its status.
    // A grounded aircraft cannot be booked regardless of time availability.
    const aircraft = await this.prisma.aircraft.findUnique({
      where: { id: input.aircraftId },
    });

    if (!aircraft) {
      throw new BadRequestException(
        `Aircraft with ID "${input.aircraftId}" not found.`,
      );
    }

    if (aircraft.airworthinessStatus === AirworthinessStatus.GROUNDED) {
      throw new BadRequestException(
        `Aircraft "${aircraft.tailNumber}" is GROUNDED and cannot be booked. ` +
          'It must be cleared by maintenance before scheduling.',
      );
    }

    // ---- INVARIANT 2: Overlap Detection ----
    // Two time intervals overlap if: existingStart < requestedEnd AND
    // existingEnd > requestedStart. This query finds any existing booking
    // for the same aircraft whose time block intersects with the request.
    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        aircraftId: input.aircraftId,
        // The overlap condition expressed as Prisma query filters:
        // existing.startTime < input.endTime AND existing.endTime > input.startTime
        startTime: { lt: new Date(input.endTime) },
        endTime: { gt: new Date(input.startTime) },
      },
    });

    if (overlappingBooking) {
      throw new ConflictException(
        `The requested time block conflicts with an existing booking ` +
          `(${overlappingBooking.startTime.toISOString()} - ` +
          `${overlappingBooking.endTime.toISOString()}). ` +
          'Please choose a different time.',
      );
    }

    // ---- Create the Booking ----
    // Both invariants are satisfied — persist the booking to PostgreSQL
    // via the Model layer and return it with populated relations.
    return this.prisma.booking.create({
      data: {
        userId,
        aircraftId: input.aircraftId,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
      },
      include: {
        user: true,
        aircraft: true,
      },
    });
  }

  /**
   * Retrieves all bookings, optionally filtered by user.
   * Includes related user and aircraft data for the GraphQL response.
   */
  async findAll(userId?: string) {
    return this.prisma.booking.findMany({
      where: userId ? { userId } : undefined,
      include: { user: true, aircraft: true },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Retrieves a single booking by ID.
   */
  async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { user: true, aircraft: true },
    });
  }
}
