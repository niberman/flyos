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
exports.SquawkService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let SquawkService = class SquawkService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSquawk(organizationId, data) {
        const aircraft = await this.prisma.aircraft.findFirst({
            where: { id: data.aircraftId, organizationId },
        });
        if (!aircraft) {
            throw new common_1.BadRequestException('Aircraft not found in your organization.');
        }
        const squawk = await this.prisma.squawk.create({
            data: {
                organizationId,
                aircraftId: data.aircraftId,
                title: data.title,
                description: data.description ?? null,
                groundsAircraft: data.groundsAircraft ?? false,
                status: client_1.SquawkStatus.OPEN,
            },
        });
        if (squawk.groundsAircraft && squawk.status === client_1.SquawkStatus.OPEN) {
            await this.prisma.aircraft.update({
                where: { id: data.aircraftId },
                data: { airworthinessStatus: client_1.AirworthinessStatus.GROUNDED },
            });
        }
        return squawk;
    }
    async updateSquawkStatus(organizationId, squawkId, status) {
        const existing = await this.prisma.squawk.findFirst({
            where: { id: squawkId, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Squawk not found.');
        }
        const squawk = await this.prisma.squawk.update({
            where: { id: squawkId },
            data: {
                status,
                clearedAt: status === client_1.SquawkStatus.CLEARED
                    ? new Date()
                    : status === client_1.SquawkStatus.OPEN
                        ? null
                        : existing.clearedAt,
            },
        });
        await this.reconcileAircraftAirworthiness(existing.aircraftId);
        return squawk;
    }
    async listForOrganization(organizationId, aircraftId) {
        return this.prisma.squawk.findMany({
            where: {
                organizationId,
                ...(aircraftId ? { aircraftId } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async reconcileAircraftAirworthiness(aircraftId) {
        const openGrounding = await this.prisma.squawk.count({
            where: {
                aircraftId,
                status: client_1.SquawkStatus.OPEN,
                groundsAircraft: true,
            },
        });
        if (openGrounding > 0) {
            await this.prisma.aircraft.update({
                where: { id: aircraftId },
                data: { airworthinessStatus: client_1.AirworthinessStatus.GROUNDED },
            });
            return;
        }
        await this.prisma.aircraft.update({
            where: { id: aircraftId },
            data: { airworthinessStatus: client_1.AirworthinessStatus.FLIGHT_READY },
        });
    }
    async hasOpenGroundingSquawk(aircraftId) {
        const n = await this.prisma.squawk.count({
            where: {
                aircraftId,
                status: client_1.SquawkStatus.OPEN,
                groundsAircraft: true,
            },
        });
        return n > 0;
    }
};
exports.SquawkService = SquawkService;
exports.SquawkService = SquawkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SquawkService);
//# sourceMappingURL=squawk.service.js.map