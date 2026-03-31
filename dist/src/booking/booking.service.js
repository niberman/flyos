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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingService = class BookingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBooking(userId, input) {
        const aircraft = await this.prisma.aircraft.findUnique({
            where: { id: input.aircraftId },
        });
        if (!aircraft) {
            throw new common_1.BadRequestException(`Aircraft with ID "${input.aircraftId}" not found.`);
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
    async findAll(userId) {
        return this.prisma.booking.findMany({
            where: userId ? { userId } : undefined,
            include: { user: true, aircraft: true },
            orderBy: { startTime: 'asc' },
        });
    }
    async findById(id) {
        return this.prisma.booking.findUnique({
            where: { id },
            include: { user: true, aircraft: true },
        });
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingService);
//# sourceMappingURL=booking.service.js.map