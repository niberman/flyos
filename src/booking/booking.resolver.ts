// ==========================================================================
// BookingResolver — GraphQL Controller for Flight Scheduling
// ==========================================================================

import {
  Resolver,
  Query,
  Mutation,
  Args,
  Subscription,
} from '@nestjs/graphql';
import { Inject, UnauthorizedException, UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { Role } from '@prisma/client';
import { BookingType } from './booking.type';
import { BookingService } from './booking.service';
import { CreateBookingInput } from './dto/create-booking.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => BookingType)
export class BookingResolver {
  constructor(
    private readonly bookingService: BookingService,
    private readonly prisma: PrismaService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  private async requireOrganizationId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return user.organizationId;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => BookingType, {
    description:
      'Create a flight booking. Fails if aircraft is grounded or time conflicts exist.',
  })
  async createBooking(
    @CurrentUser() user: { userId: string; role: string },
    @Args('input') input: CreateBookingInput,
  ): Promise<BookingType> {
    const organizationId = await this.requireOrganizationId(user.userId);
    return this.bookingService.createBooking(
      user.userId,
      organizationId,
      input,
    ) as unknown as BookingType;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Query(() => [BookingType], {
    description: 'List all bookings in the organization. INSTRUCTOR and DISPATCHER only.',
  })
  async bookings(
    @CurrentUser() user: { userId: string; role: string },
    @Args('baseId', { nullable: true, type: () => String }) baseId?: string,
  ): Promise<BookingType[]> {
    const organizationId = await this.requireOrganizationId(user.userId);
    return this.bookingService.findAll(
      organizationId,
      baseId,
    ) as unknown as BookingType[];
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [BookingType], {
    description: 'List bookings for the currently authenticated user.',
  })
  async myBookings(
    @CurrentUser() user: { userId: string; role: string },
    @Args('baseId', { nullable: true, type: () => String }) baseId?: string,
  ): Promise<BookingType[]> {
    const organizationId = await this.requireOrganizationId(user.userId);
    return this.bookingService.myBookings(
      user.userId,
      organizationId,
      baseId,
    ) as unknown as BookingType[];
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Query(() => [BookingType], {
    description: 'Bookings at a specific base, optionally filtered by date range.',
  })
  async bookingsByBase(
    @CurrentUser() user: { userId: string; role: string },
    @Args('baseId', { type: () => String }) baseId: string,
    @Args('startDate', { nullable: true, type: () => Date }) startDate?: Date,
    @Args('endDate', { nullable: true, type: () => Date }) endDate?: Date,
  ): Promise<BookingType[]> {
    const organizationId = await this.requireOrganizationId(user.userId);
    return this.bookingService.findByBase(organizationId, baseId, {
      startDate,
      endDate,
    }) as unknown as BookingType[];
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Query(() => [BookingType], {
    description: 'Bookings for a specific aircraft, optionally filtered by date range.',
  })
  async bookingsByAircraft(
    @CurrentUser() user: { userId: string; role: string },
    @Args('aircraftId', { type: () => String }) aircraftId: string,
    @Args('startDate', { nullable: true, type: () => Date }) startDate?: Date,
    @Args('endDate', { nullable: true, type: () => Date }) endDate?: Date,
  ): Promise<BookingType[]> {
    const organizationId = await this.requireOrganizationId(user.userId);
    return this.bookingService.findByAircraft(organizationId, aircraftId, {
      startDate,
      endDate,
    }) as unknown as BookingType[];
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean, {
    description:
      'Cancel a booking. Allowed for the booking owner or any DISPATCHER in the same organization.',
  })
  async cancelBooking(
    @CurrentUser() user: { userId: string; role: string },
    @Args('bookingId', { type: () => String }) bookingId: string,
  ): Promise<boolean> {
    const organizationId = await this.requireOrganizationId(user.userId);
    return this.bookingService.cancelBooking(
      bookingId,
      user.userId,
      user.role as Role,
      organizationId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Subscription(() => BookingType, {
    filter: (payload, _variables, context) => {
      return (
        payload.bookingUpdated.organizationId ===
        context.req?.user?.organizationId
      );
    },
    resolve: (payload: {
      bookingUpdated: Record<string, unknown> & { organizationId?: string };
    }) => {
      const { organizationId: _org, ...booking } = payload.bookingUpdated;
      return booking;
    },
  })
  bookingUpdated() {
    return this.pubSub.asyncIterator('bookingUpdated');
  }
}
