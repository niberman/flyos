// ==========================================================================
// BookingService — Schedulable resources, participants, dispatch lifecycle
// ==========================================================================

import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  AirworthinessStatus,
  BookingParticipantRole,
  BookingStatus,
  Role,
  SchedulableResourceKind,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingInput } from './dto/create-booking.input';
import { PilotComplianceService } from '../pilot-compliance/pilot-compliance.service';

export interface BookingDateRange {
  startDate?: Date;
  endDate?: Date;
}

const ACTIVE_OVERLAP_STATUSES: BookingStatus[] = [
  BookingStatus.SCHEDULED,
  BookingStatus.DISPATCHED,
  BookingStatus.IN_PROGRESS,
];

const bookingInclude = {
  user: true,
  base: true,
  schedulableResource: { include: { aircraft: true } },
  participants: { include: { user: true } },
} as const;

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pilotCompliance: PilotComplianceService,
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

  private notCancelledWhere() {
    return { status: { not: BookingStatus.CANCELLED } };
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

  private async resolveSchedulableResource(
    organizationId: string,
    input: CreateBookingInput,
  ) {
    const hasAircraft = Boolean(input.aircraftId);
    const hasResource = Boolean(input.schedulableResourceId);
    if (hasAircraft === hasResource) {
      throw new BadRequestException(
        'Provide exactly one of aircraftId or schedulableResourceId.',
      );
    }

    if (input.schedulableResourceId) {
      const resource = await this.prisma.schedulableResource.findFirst({
        where: { id: input.schedulableResourceId, organizationId },
        include: { aircraft: true },
      });
      if (!resource) {
        throw new BadRequestException(
          `Schedulable resource "${input.schedulableResourceId}" not found.`,
        );
      }
      if (!resource.isActive) {
        throw new BadRequestException(
          'This schedulable resource is not active.',
        );
      }
      return resource;
    }

    const resource = await this.prisma.schedulableResource.findFirst({
      where: { aircraftId: input.aircraftId!, organizationId },
      include: { aircraft: true },
    });
    if (!resource) {
      throw new BadRequestException(
        `No schedulable resource found for aircraft "${input.aircraftId}".`,
      );
    }
    if (!resource.isActive) {
      throw new BadRequestException('This aircraft resource is not active.');
    }
    return resource;
  }

  async createBooking(
    userId: string,
    organizationId: string,
    input: CreateBookingInput,
  ) {
    const resource = await this.resolveSchedulableResource(
      organizationId,
      input,
    );

    if (
      resource.kind === SchedulableResourceKind.AIRCRAFT &&
      resource.aircraft
    ) {
      const ac = resource.aircraft;
      if (ac.airworthinessStatus === AirworthinessStatus.GROUNDED) {
        throw new BadRequestException(
          `Aircraft "${ac.tailNumber}" is GROUNDED and cannot be booked.`,
        );
      }
    }

    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        schedulableResourceId: resource.id,
        status: { in: ACTIVE_OVERLAP_STATUSES },
        startTime: { lt: new Date(input.endTime) },
        endTime: { gt: new Date(input.startTime) },
      },
    });

    if (overlappingBooking) {
      throw new ConflictException(
        `The requested time block conflicts with an existing booking ` +
          `(${overlappingBooking.startTime.toISOString()} - ` +
          `${overlappingBooking.endTime.toISOString()}).`,
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

    const extra = input.participants ?? [];
    let instructorUserId: string | null = null;
    for (const p of extra) {
      if (p.role !== BookingParticipantRole.INSTRUCTOR) {
        throw new BadRequestException(
          'Additional participants must use role INSTRUCTOR only.',
        );
      }
      if (instructorUserId && p.userId !== instructorUserId) {
        throw new BadRequestException('At most one instructor may be added.');
      }
      instructorUserId = p.userId;
    }

    if (instructorUserId === userId) {
      throw new BadRequestException(
        'Instructor must be a different user than the renter.',
      );
    }

    if (instructorUserId) {
      const instUser = await this.prisma.user.findFirst({
        where: { id: instructorUserId, organizationId },
      });
      if (!instUser) {
        throw new BadRequestException(
          'Instructor user not found in your organization.',
        );
      }
    }

    const startTime = new Date(input.startTime);
    await this.pilotCompliance.assertEligibleForBooking(organizationId, {
      renterUserId: userId,
      instructorUserId,
      aircraftId: resource.aircraftId,
      startTime,
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId,
          schedulableResourceId: resource.id,
          baseId: input.baseId,
          startTime,
          endTime: new Date(input.endTime),
          status: BookingStatus.SCHEDULED,
          participants: {
            create: [
              {
                userId,
                role: BookingParticipantRole.RENTER,
                organizationId,
              },
              ...(instructorUserId
                ? [
                    {
                      userId: instructorUserId,
                      role: BookingParticipantRole.INSTRUCTOR,
                      organizationId,
                    },
                  ]
                : []),
            ],
          },
        },
        include: bookingInclude,
      });
      return booking;
    });

    await this.publishBookingUpdated(created);

    return created;
  }

  async findAll(organizationId: string, baseId?: string) {
    return this.prisma.booking.findMany({
      where: {
        base: { organizationId },
        ...this.notCancelledWhere(),
        ...(baseId ? { baseId } : {}),
      },
      include: bookingInclude,
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
        ...this.notCancelledWhere(),
        ...this.buildDateRangeWhere(dateRange),
      },
      include: bookingInclude,
      orderBy: { startTime: 'asc' },
    });
  }

  async findByAircraft(
    organizationId: string,
    aircraftId: string,
    dateRange?: BookingDateRange,
  ) {
    const resource = await this.prisma.schedulableResource.findFirst({
      where: { aircraftId, organizationId },
    });
    if (!resource) {
      return [];
    }
    return this.findBySchedulableResource(
      organizationId,
      resource.id,
      dateRange,
    );
  }

  async findBySchedulableResource(
    organizationId: string,
    schedulableResourceId: string,
    dateRange?: BookingDateRange,
  ) {
    return this.prisma.booking.findMany({
      where: {
        schedulableResourceId,
        base: { organizationId },
        ...this.notCancelledWhere(),
        ...this.buildDateRangeWhere(dateRange),
      },
      include: bookingInclude,
      orderBy: { startTime: 'asc' },
    });
  }

  async myBookings(userId: string, organizationId: string, baseId?: string) {
    return this.prisma.booking.findMany({
      where: {
        base: { organizationId },
        ...this.notCancelledWhere(),
        ...(baseId ? { baseId } : {}),
        OR: [{ userId }, { participants: { some: { userId } } }],
      },
      include: bookingInclude,
      orderBy: { startTime: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
  }

  async dispatchBooking(
    bookingId: string,
    actorUserId: string,
    role: Role,
    organizationId: string,
    hobbsOut?: number,
    tachOut?: number,
  ) {
    if (role !== Role.INSTRUCTOR && role !== Role.DISPATCHER) {
      throw new ForbiddenException(
        'Only instructors or dispatchers can dispatch.',
      );
    }

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, base: { organizationId } },
      include: bookingInclude,
    });

    if (!booking) {
      throw new BadRequestException(
        `Booking with ID "${bookingId}" not found.`,
      );
    }

    if (booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException(
        `Booking must be SCHEDULED to dispatch (current: ${booking.status}).`,
      );
    }

    const data: Prisma.BookingUpdateInput = {
      status: BookingStatus.DISPATCHED,
      dispatchedAt: new Date(),
    };

    if (
      booking.schedulableResource.kind === SchedulableResourceKind.AIRCRAFT &&
      booking.schedulableResource.aircraftId
    ) {
      if (hobbsOut !== undefined) {
        data.hobbsOut = new Prisma.Decimal(hobbsOut);
      }
      if (tachOut !== undefined) {
        data.tachOut = new Prisma.Decimal(tachOut);
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data,
      include: bookingInclude,
    });

    await this.publishBookingUpdated(updated);
    return updated;
  }

  async completeBooking(
    bookingId: string,
    actorUserId: string,
    role: Role,
    organizationId: string,
    hobbsIn?: number,
    tachIn?: number,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, base: { organizationId } },
      include: bookingInclude,
    });

    if (!booking) {
      throw new BadRequestException(
        `Booking with ID "${bookingId}" not found.`,
      );
    }

    const isOwner = booking.userId === actorUserId;
    const canComplete =
      isOwner || role === Role.INSTRUCTOR || role === Role.DISPATCHER;
    if (!canComplete) {
      throw new ForbiddenException('You cannot complete this booking.');
    }

    if (booking.status !== BookingStatus.DISPATCHED) {
      throw new BadRequestException(
        `Booking must be DISPATCHED to complete (current: ${booking.status}).`,
      );
    }

    const isAircraft =
      booking.schedulableResource.kind === SchedulableResourceKind.AIRCRAFT &&
      Boolean(booking.schedulableResource.aircraftId);

    if (isAircraft && (hobbsIn === undefined || tachIn === undefined)) {
      throw new BadRequestException(
        'hobbsIn and tachIn are required when completing an aircraft booking.',
      );
    }

    const decInH = hobbsIn !== undefined ? new Prisma.Decimal(hobbsIn) : null;
    const decInT = tachIn !== undefined ? new Prisma.Decimal(tachIn) : null;

    if (isAircraft && decInH && decInT) {
      if (booking.hobbsOut && decInH.lt(booking.hobbsOut)) {
        throw new BadRequestException(
          'hobbsIn must be greater than or equal to hobbsOut.',
        );
      }
      if (booking.tachOut && decInT.lt(booking.tachOut)) {
        throw new BadRequestException(
          'tachIn must be greater than or equal to tachOut.',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
          ...(decInH ? { hobbsIn: decInH } : {}),
          ...(decInT ? { tachIn: decInT } : {}),
        },
        include: bookingInclude,
      });

      if (isAircraft && b.schedulableResource.aircraftId && decInH && decInT) {
        await tx.aircraft.update({
          where: { id: b.schedulableResource.aircraftId },
          data: {
            hobbsHours: decInH,
            tachHours: decInT,
          },
        });
      }

      return b;
    });

    await this.publishBookingUpdated(updated);
    return updated;
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    role: Role,
    organizationId: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, base: { organizationId } },
      include: bookingInclude,
    });

    if (!booking) {
      throw new BadRequestException(
        `Booking with ID "${bookingId}" not found.`,
      );
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled.');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking.');
    }

    const isOwner = booking.userId === userId;
    const isDispatcher = role === Role.DISPATCHER;

    if (!isOwner && !isDispatcher) {
      throw new ForbiddenException('You cannot cancel this booking.');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: bookingInclude,
    });

    await this.publishBookingUpdated(updated);

    return true;
  }
}
