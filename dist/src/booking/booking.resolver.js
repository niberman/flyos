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
exports.BookingResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const client_1 = require("@prisma/client");
const booking_type_1 = require("./booking.type");
const booking_service_1 = require("./booking.service");
const create_booking_input_1 = require("./dto/create-booking.input");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingResolver = class BookingResolver {
    bookingService;
    prisma;
    pubSub;
    constructor(bookingService, prisma, pubSub) {
        this.bookingService = bookingService;
        this.prisma = prisma;
        this.pubSub = pubSub;
    }
    async requireOrganizationId(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found.');
        }
        return user.organizationId;
    }
    async createBooking(user, input) {
        const organizationId = await this.requireOrganizationId(user.userId);
        return this.bookingService.createBooking(user.userId, organizationId, input);
    }
    async bookings(user, baseId) {
        const organizationId = await this.requireOrganizationId(user.userId);
        return this.bookingService.findAll(organizationId, baseId);
    }
    async myBookings(user, baseId) {
        const organizationId = await this.requireOrganizationId(user.userId);
        return this.bookingService.myBookings(user.userId, organizationId, baseId);
    }
    async bookingsByBase(user, baseId, startDate, endDate) {
        const organizationId = await this.requireOrganizationId(user.userId);
        return this.bookingService.findByBase(organizationId, baseId, {
            startDate,
            endDate,
        });
    }
    async bookingsByAircraft(user, aircraftId, startDate, endDate) {
        const organizationId = await this.requireOrganizationId(user.userId);
        return this.bookingService.findByAircraft(organizationId, aircraftId, {
            startDate,
            endDate,
        });
    }
    async cancelBooking(user, bookingId) {
        const organizationId = await this.requireOrganizationId(user.userId);
        return this.bookingService.cancelBooking(bookingId, user.userId, user.role, organizationId);
    }
    bookingUpdated() {
        return this.pubSub.asyncIterator('bookingUpdated');
    }
};
exports.BookingResolver = BookingResolver;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, graphql_1.Mutation)(() => booking_type_1.BookingType, {
        description: 'Create a flight booking. Fails if aircraft is grounded or time conflicts exist.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_booking_input_1.CreateBookingInput]),
    __metadata("design:returntype", Promise)
], BookingResolver.prototype, "createBooking", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.INSTRUCTOR, client_1.Role.DISPATCHER),
    (0, graphql_1.Query)(() => [booking_type_1.BookingType], {
        description: 'List all bookings in the organization. INSTRUCTOR and DISPATCHER only.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('baseId', { nullable: true, type: () => String })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BookingResolver.prototype, "bookings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, graphql_1.Query)(() => [booking_type_1.BookingType], {
        description: 'List bookings for the currently authenticated user.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('baseId', { nullable: true, type: () => String })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BookingResolver.prototype, "myBookings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.INSTRUCTOR, client_1.Role.DISPATCHER),
    (0, graphql_1.Query)(() => [booking_type_1.BookingType], {
        description: 'Bookings at a specific base, optionally filtered by date range.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('baseId', { type: () => String })),
    __param(2, (0, graphql_1.Args)('startDate', { nullable: true, type: () => Date })),
    __param(3, (0, graphql_1.Args)('endDate', { nullable: true, type: () => Date })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Date,
        Date]),
    __metadata("design:returntype", Promise)
], BookingResolver.prototype, "bookingsByBase", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.INSTRUCTOR, client_1.Role.DISPATCHER),
    (0, graphql_1.Query)(() => [booking_type_1.BookingType], {
        description: 'Bookings for a specific aircraft, optionally filtered by date range.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('aircraftId', { type: () => String })),
    __param(2, (0, graphql_1.Args)('startDate', { nullable: true, type: () => Date })),
    __param(3, (0, graphql_1.Args)('endDate', { nullable: true, type: () => Date })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Date,
        Date]),
    __metadata("design:returntype", Promise)
], BookingResolver.prototype, "bookingsByAircraft", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, graphql_1.Mutation)(() => Boolean, {
        description: 'Cancel a booking. Allowed for the booking owner or any DISPATCHER in the same organization.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('bookingId', { type: () => String })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BookingResolver.prototype, "cancelBooking", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, graphql_1.Subscription)(() => booking_type_1.BookingType, {
        filter: (payload, _variables, context) => {
            return (payload.bookingUpdated.organizationId ===
                context.req?.user?.organizationId);
        },
        resolve: (payload) => {
            const { organizationId: _org, ...booking } = payload.bookingUpdated;
            return booking;
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BookingResolver.prototype, "bookingUpdated", null);
exports.BookingResolver = BookingResolver = __decorate([
    (0, graphql_1.Resolver)(() => booking_type_1.BookingType),
    __param(2, (0, common_1.Inject)('PUB_SUB')),
    __metadata("design:paramtypes", [booking_service_1.BookingService,
        prisma_service_1.PrismaService,
        graphql_subscriptions_1.PubSub])
], BookingResolver);
//# sourceMappingURL=booking.resolver.js.map