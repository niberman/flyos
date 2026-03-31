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
const booking_type_1 = require("./booking.type");
const booking_service_1 = require("./booking.service");
const create_booking_input_1 = require("./dto/create-booking.input");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let BookingResolver = class BookingResolver {
    bookingService;
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    async createBooking(user, input) {
        return this.bookingService.createBooking(user.userId, input);
    }
    async bookings() {
        return this.bookingService.findAll();
    }
    async myBookings(user) {
        return this.bookingService.findAll(user.userId);
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
        description: 'List all bookings. INSTRUCTOR and DISPATCHER only.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingResolver.prototype, "bookings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, graphql_1.Query)(() => [booking_type_1.BookingType], {
        description: 'List bookings for the currently authenticated user.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingResolver.prototype, "myBookings", null);
exports.BookingResolver = BookingResolver = __decorate([
    (0, graphql_1.Resolver)(() => booking_type_1.BookingType),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], BookingResolver);
//# sourceMappingURL=booking.resolver.js.map