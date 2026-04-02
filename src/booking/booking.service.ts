// ==========================================================================
// BookingService — Business Logic for Flight Scheduling
// ==========================================================================

import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { AirworthinessStatus, Role } from '@prisma/client';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingInput } from './dto/create-booking.input';

export interface BookingDateRange {
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  private buildDateRangeWhere(range?: BookingDateRange) {
    if (!range?.startDate && !range?.endDate) {
      return {};
    }
    if (range.startDate && range.endDate) {
      return {
        startTime: { lt: new Date(range.endDate) },
        endTime: { gt: new Date(range.startDate) },
      };
    }
    if (range.startDate) {
      return { startTime: { gte: new Date(range.startDate) } };
    }
    return { endTime: { lte: new Date(range.endDate!) } };
  }

  private async publishBookingUpdated(
    booking: Record<string, unknown> & {
      base?: { organizationId: string };
    },
  ) {
    const organizationId = booking.base?.organizationId;
    if (!organizationId) {
      return;
    }
    await this.pubSub.publish('bookingUpdated', {
      bookingUpdated: { ...booking, organizationId },
    });
  }

  async createBooking(
    userId: string,
    organizationId: string,
    input: CreateBookingInput,
  ) {
    const aircraft = await this.prisma.aircraft.findUnique({
      where: { id: input.aircraftId },
    });

    if (!aircraft) {
      throw new BadRequestException(
        `Aircraft with ID "${input.aircraftId}" not found.`,
      );
    }

    if (aircraft.organizationId !== organizationId) {
      throw new BadRequestException(
        `Aircraft with ID "${input.aircraftId}" is not available in your organization.`,
      );
    }

    if (aircraft.airworthinessStatus === AirworthinessStatus.GROUNDED) {
      throw new BadRequestException(
        `Aircraft "${aircraft.tailNumber}" is GROUNDED and cannot be booked. ` +
          'It must be cleared by maintenance before scheduling.',
      );
    }

    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        aircraftId: input.aircraftId,
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

    const base = await this.prisma.base.findUnique({
      where: { id: input.baseId },
    });

    if (!base || base.organizationId !== organizationId) {
      throw new BadRequestException(
        `Base with ID "${input.baseId}" not found or is not in your organization.`,
      );
    }

    const created = await this.prisma.booking.create({
      data: {
        userId,
        aircraftId: input.aircraftId,
        baseId: input.baseId,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
      },
      include: {
        user: true,
        aircraft: true,
        base: true,
      },
    });

    await this.publishBookingUpdated(created);

    return created;
  }

  async findAll(organizationId: string, baseId?: string) {
    return this.prisma.booking.findMany({
      where: {
        base: { organizationId },
        ...(baseId ? { baseId } : {}),
      },
      include: { user: true, aircraft: true, base: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByBase(
    organizationId: string,
    baseId: string,
    dateRange?: BookingDateRange,
  ) {
    return this.prisma.booking.findMany({
      where: {
        baseId,
        base: { organizationId },
        ...this.buildDateRangeWhere(dateRange),
      },
      include: { user: true, aircraft: true, base: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByAircraft(
    organizationId: string,
    aircraftId: string,
    dateRange?: BookingDateRange,
  ) {
    return this.prisma.booking.findMany({
      where: {
        aircraftId,
        base: { organizationId },
        ...this.buildDateRangeWhere(dateRange),
      },
      include: { user: true, aircraft: true, base: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async myBookings(
    userId: string,
    organizationId: string,
    baseId?: string,
  ) {
    return this.prisma.booking.findMany({
      where: {
        userId,
        base: { organizationId },
        ...(baseId ? { baseId } : {}),
      },
      include: { user: true, aircraft: true, base: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { user: true, aircraft: true, base: true },
    });
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    role: Role,
    organizationId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { base: true, user: true, aircraft: true },
    });

    if (!booking) {
      throw new BadRequestException(`Booking with ID "${bookingId}" not found.`);
    }

    if (booking.base.organizationId !== organizationId) {
      throw new ForbiddenException('You cannot cancel this booking.');
    }

    const isOwner = booking.userId === userId;
    const isDispatcher = role === Role.DISPATCHER;

    if (!isOwner && !isDispatcher) {
      throw new ForbiddenException('You cannot cancel this booking.');
    }

    await this.prisma.booking.delete({
      where: { id: bookingId },
    });

    await this.publishBookingUpdated(booking);

    return true;
  }
}
