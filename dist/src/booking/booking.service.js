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
const graphql_subscriptions_1 = require("graphql-subscriptions");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingService = class BookingService {
    prisma;
    pubSub;
    constructor(prisma, pubSub) {
        this.prisma = prisma;
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
    async publishBookingUpdated(booking) {
        const organizationId = booking.base?.organizationId;
        if (!organizationId) {
            return;
        }
        await this.pubSub.publish('bookingUpdated', {
            bookingUpdated: { ...booking, organizationId },
        });
    }
    async createBooking(userId, organizationId, input) {
        const aircraft = await this.prisma.aircraft.findUnique({
            where: { id: input.aircraftId },
        });
        if (!aircraft) {
            throw new common_1.BadRequestException(`Aircraft with ID "${input.aircraftId}" not found.`);
        }
        if (aircraft.organizationId !== organizationId) {
            throw new common_1.BadRequestException(`Aircraft with ID "${input.aircraftId}" is not available in your organization.`);
        }
        if (aircraft.airworthinessStatus === client_1.AirworthinessStatus.GROUNDED) {
            throw new common_1.BadRequestException(`Aircraft "${aircraft.tailNumber}" is GROUNDED and cannot be booked. ` +
                'It must be cleared by maintenance before scheduling.');
        }
        const overlappingBooking = await this.prisma.booking.findFirst({
            where: {
                aircraftId: input.aircraftId,
                startTime: { lt: new Date(input.endTime) },
                endTime: { gt: new Date(input.startTime) },
            },
        });
        if (overlappingBooking) {
            throw new common_1.ConflictException(`The requested time block conflicts with an existing booking ` +
                `(${overlappingBooking.startTime.toISOString()} - ` +
                `${overlappingBooking.endTime.toISOString()}). ` +
                'Please choose a different time.');
        }
        const base = await this.prisma.base.findUnique({
            where: { id: input.baseId },
        });
        if (!base || base.organizationId !== organizationId) {
            throw new common_1.BadRequestException(`Base with ID "${input.baseId}" not found or is not in your organization.`);
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
    async findAll(organizationId, baseId) {
        return this.prisma.booking.findMany({
            where: {
                base: { organizationId },
                ...(baseId ? { baseId } : {}),
            },
            include: { user: true, aircraft: true, base: true },
            orderBy: { startTime: 'asc' },
        });
    }
    async findByBase(organizationId, baseId, dateRange) {
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
    async findByAircraft(organizationId, aircraftId, dateRange) {
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
    async myBookings(userId, organizationId, baseId) {
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
    async findById(id) {
        return this.prisma.booking.findUnique({
            where: { id },
            include: { user: true, aircraft: true, base: true },
        });
    }
    async cancelBooking(bookingId, userId, role, organizationId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { base: true, user: true, aircraft: true },
        });
        if (!booking) {
            throw new common_1.BadRequestException(`Booking with ID "${bookingId}" not found.`);
        }
        if (booking.base.organizationId !== organizationId) {
            throw new common_1.ForbiddenException('You cannot cancel this booking.');
        }
        const isOwner = booking.userId === userId;
        const isDispatcher = role === client_1.Role.DISPATCHER;
        if (!isOwner && !isDispatcher) {
            throw new common_1.ForbiddenException('You cannot cancel this booking.');
        }
        await this.prisma.booking.delete({
            where: { id: bookingId },
        });
        await this.publishBookingUpdated(booking);
        return true;
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('PUB_SUB')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        graphql_subscriptions_1.PubSub])
], BookingService);
//# sourceMappingURL=booking.service.js.map