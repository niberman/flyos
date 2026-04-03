"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const prisma_service_1 = require("../prisma/prisma.service");
const pilot_compliance_service_1 = require("../pilot-compliance/pilot-compliance.service");
const ACTIVE_OVERLAP_STATUSES = [
    client_1.BookingStatus.SCHEDULED,
    client_1.BookingStatus.DISPATCHED,
    client_1.BookingStatus.IN_PROGRESS,
];
const bookingInclude = {
    user: true,
    base: true,
    schedulableResource: { include: { aircraft: true } },
    participants: { include: { user: true } },
};
let BookingService = class BookingService {
    prisma;
    pilotCompliance;
    pubSub;
    constructor(prisma, pilotCompliance, pubSub) {
        this.prisma = prisma;
        this.pilotCompliance = pilotCompliance;
        this.pubSub = pubSub;
    }
    buildDateRangeWhere(range) {
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
        return { endTime: { lte: new Date(range.endDate) } };
    }
    notCancelledWhere() {
        return { status: { not: client_1.BookingStatus.CANCELLED } };
    }
    async publishBookingUpdated(booking) {
        const organizationId = booking.base?.organizationId;
        if (!organizationId) {
            return;
        }
        await this.pubSub.publish('bookingUpdated', {
            bookingUpdated: { ...booking, organizationId },
        });
    }
    async resolveSchedulableResource(organizationId, input) {
        const hasAircraft = Boolean(input.aircraftId);
        const hasResource = Boolean(input.schedulableResourceId);
        if (hasAircraft === hasResource) {
            throw new common_1.BadRequestException('Provide exactly one of aircraftId or schedulableResourceId.');
        }
        if (input.schedulableResourceId) {
            const resource = await this.prisma.schedulableResource.findFirst({
                where: { id: input.schedulableResourceId, organizationId },
                include: { aircraft: true },
            });
            if (!resource) {
                throw new common_1.BadRequestException(`Schedulable resource "${input.schedulableResourceId}" not found.`);
            }
            if (!resource.isActive) {
                throw new common_1.BadRequestException('This schedulable resource is not active.');
            }
            return resource;
        }
        const resource = await this.prisma.schedulableResource.findFirst({
            where: { aircraftId: input.aircraftId, organizationId },
            include: { aircraft: true },
        });
        if (!resource) {
            throw new common_1.BadRequestException(`No schedulable resource found for aircraft "${input.aircraftId}".`);
        }
        if (!resource.isActive) {
            throw new common_1.BadRequestException('This aircraft resource is not active.');
        }
        return resource;
    }
    async createBooking(userId, organizationId, input) {
        const resource = await this.resolveSchedulableResource(organizationId, input);
        if (resource.kind === client_1.SchedulableResourceKind.AIRCRAFT &&
            resource.aircraft) {
            const ac = resource.aircraft;
            if (ac.airworthinessStatus === client_1.AirworthinessStatus.GROUNDED) {
                throw new common_1.BadRequestException(`Aircraft "${ac.tailNumber}" is GROUNDED and cannot be booked.`);
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
            throw new common_1.ConflictException(`The requested time block conflicts with an existing booking ` +
                `(${overlappingBooking.startTime.toISOString()} - ` +
                `${overlappingBooking.endTime.toISOString()}).`);
        }
        const base = await this.prisma.base.findUnique({
            where: { id: input.baseId },
        });
        if (!base || base.organizationId !== organizationId) {
            throw new common_1.BadRequestException(`Base with ID "${input.baseId}" not found or is not in your organization.`);
        }
        const extra = input.participants ?? [];
        let instructorUserId = null;
        for (const p of extra) {
            if (p.role !== client_1.BookingParticipantRole.INSTRUCTOR) {
                throw new common_1.BadRequestException('Additional participants must use role INSTRUCTOR only.');
            }
            if (instructorUserId && p.userId !== instructorUserId) {
                throw new common_1.BadRequestException('At most one instructor may be added.');
            }
            instructorUserId = p.userId;
        }
        if (instructorUserId === userId) {
            throw new common_1.BadRequestException('Instructor must be a different user than the renter.');
        }
        if (instructorUserId) {
            const instUser = await this.prisma.user.findFirst({
                where: { id: instructorUserId, organizationId },
            });
            if (!instUser) {
                throw new common_1.BadRequestException('Instructor user not found in your organization.');
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
                    status: client_1.BookingStatus.SCHEDULED,
                    participants: {
                        create: [
                            {
                                userId,
                                role: client_1.BookingParticipantRole.RENTER,
                                organizationId,
                            },
                            ...(instructorUserId
                                ? [
                                    {
                                        userId: instructorUserId,
                                        role: client_1.BookingParticipantRole.INSTRUCTOR,
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
    async findAll(organizationId, baseId) {
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
    async findByBase(organizationId, baseId, dateRange) {
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
    async findByAircraft(organizationId, aircraftId, dateRange) {
        const resource = await this.prisma.schedulableResource.findFirst({
            where: { aircraftId, organizationId },
        });
        if (!resource) {
            return [];
        }
        return this.findBySchedulableResource(organizationId, resource.id, dateRange);
    }
    async findBySchedulableResource(organizationId, schedulableResourceId, dateRange) {
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
    async myBookings(userId, organizationId, baseId) {
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
    async findById(id) {
        return this.prisma.booking.findUnique({
            where: { id },
            include: bookingInclude,
        });
    }
    async dispatchBooking(bookingId, actorUserId, role, organizationId, hobbsOut, tachOut) {
        if (role !== client_1.Role.INSTRUCTOR && role !== client_1.Role.DISPATCHER) {
            throw new common_1.ForbiddenException('Only instructors or dispatchers can dispatch.');
        }
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, base: { organizationId } },
            include: bookingInclude,
        });
        if (!booking) {
            throw new common_1.BadRequestException(`Booking with ID "${bookingId}" not found.`);
        }
        if (booking.status !== client_1.BookingStatus.SCHEDULED) {
            throw new common_1.BadRequestException(`Booking must be SCHEDULED to dispatch (current: ${booking.status}).`);
        }
        const data = {
            status: client_1.BookingStatus.DISPATCHED,
            dispatchedAt: new Date(),
        };
        if (booking.schedulableResource.kind === client_1.SchedulableResourceKind.AIRCRAFT &&
            booking.schedulableResource.aircraftId) {
            if (hobbsOut !== undefined) {
                data.hobbsOut = new client_2.Prisma.Decimal(hobbsOut);
            }
            if (tachOut !== undefined) {
                data.tachOut = new client_2.Prisma.Decimal(tachOut);
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
    async completeBooking(bookingId, actorUserId, role, organizationId, hobbsIn, tachIn) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, base: { organizationId } },
            include: bookingInclude,
        });
        if (!booking) {
            throw new common_1.BadRequestException(`Booking with ID "${bookingId}" not found.`);
        }
        const isOwner = booking.userId === actorUserId;
        const canComplete = isOwner || role === client_1.Role.INSTRUCTOR || role === client_1.Role.DISPATCHER;
        if (!canComplete) {
            throw new common_1.ForbiddenException('You cannot complete this booking.');
        }
        if (booking.status !== client_1.BookingStatus.DISPATCHED) {
            throw new common_1.BadRequestException(`Booking must be DISPATCHED to complete (current: ${booking.status}).`);
        }
        const isAircraft = booking.schedulableResource.kind === client_1.SchedulableResourceKind.AIRCRAFT &&
            Boolean(booking.schedulableResource.aircraftId);
        if (isAircraft && (hobbsIn === undefined || tachIn === undefined)) {
            throw new common_1.BadRequestException('hobbsIn and tachIn are required when completing an aircraft booking.');
        }
        const decInH = hobbsIn !== undefined ? new client_2.Prisma.Decimal(hobbsIn) : null;
        const decInT = tachIn !== undefined ? new client_2.Prisma.Decimal(tachIn) : null;
        if (isAircraft && decInH && decInT) {
            if (booking.hobbsOut && decInH.lt(booking.hobbsOut)) {
                throw new common_1.BadRequestException('hobbsIn must be greater than or equal to hobbsOut.');
            }
            if (booking.tachOut && decInT.lt(booking.tachOut)) {
                throw new common_1.BadRequestException('tachIn must be greater than or equal to tachOut.');
            }
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const b = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: client_1.BookingStatus.COMPLETED,
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
    async cancelBooking(bookingId, userId, role, organizationId) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, base: { organizationId } },
            include: bookingInclude,
        });
        if (!booking) {
            throw new common_1.BadRequestException(`Booking with ID "${bookingId}" not found.`);
        }
        if (booking.status === client_1.BookingStatus.CANCELLED) {
            throw new common_1.BadRequestException('Booking is already cancelled.');
        }
        if (booking.status === client_1.BookingStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot cancel a completed booking.');
        }
        const isOwner = booking.userId === userId;
        const isDispatcher = role === client_1.Role.DISPATCHER;
        if (!isOwner && !isDispatcher) {
            throw new common_1.ForbiddenException('You cannot cancel this booking.');
        }
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: client_1.BookingStatus.CANCELLED,
                cancelledAt: new Date(),
            },
            include: bookingInclude,
        });
        await this.publishBookingUpdated(updated);
        return true;
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)('PUB_SUB')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pilot_compliance_service_1.PilotComplianceService,
        graphql_subscriptions_1.PubSub])
], BookingService);
//# sourceMappingURL=booking.service.js.map