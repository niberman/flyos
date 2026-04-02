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
exports.AircraftService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant.context");
let AircraftService = class AircraftService {
    prisma;
    tenantContext;
    constructor(prisma, tenantContext) {
        this.prisma = prisma;
        this.tenantContext = tenantContext;
    }
    requireOrganizationId() {
        const organizationId = this.tenantContext.organizationId;
        if (!organizationId) {
            throw new common_1.UnauthorizedException('Missing organization context.');
        }
        return organizationId;
    }
    async create(input) {
        const organizationId = this.requireOrganizationId();
        const homeBase = await this.prisma.base.findFirst({
            where: { id: input.homeBaseId, organizationId },
        });
        if (!homeBase) {
            throw new common_1.BadRequestException('homeBaseId must reference a base in your organization.');
        }
        return this.prisma.$transaction(async (tx) => {
            const aircraft = await tx.aircraft.create({
                data: {
                    tailNumber: input.tailNumber,
                    make: input.make,
                    model: input.model,
                    organizationId,
                    homeBaseId: input.homeBaseId,
                },
            });
            await tx.schedulableResource.create({
                data: {
                    organizationId,
                    baseId: input.homeBaseId,
                    kind: client_1.SchedulableResourceKind.AIRCRAFT,
                    name: input.tailNumber,
                    aircraftId: aircraft.id,
                },
            });
            return aircraft;
        });
    }
    async findAll(homeBaseId) {
        const organizationId = this.requireOrganizationId();
        return this.prisma.aircraft.findMany({
            where: {
                organizationId,
                ...(homeBaseId ? { homeBaseId } : {}),
            },
        });
    }
    async findById(id) {
        const organizationId = this.requireOrganizationId();
        const aircraft = await this.prisma.aircraft.findFirst({
            where: { id, organizationId },
        });
        if (!aircraft) {
            throw new common_1.NotFoundException(`Aircraft with ID "${id}" not found.`);
        }
        return aircraft;
    }
    async findByBase(baseId) {
        const organizationId = this.requireOrganizationId();
        const base = await this.prisma.base.findFirst({
            where: { id: baseId, organizationId },
        });
        if (!base) {
            throw new common_1.NotFoundException(`Base with ID "${baseId}" not found.`);
        }
        return this.prisma.aircraft.findMany({
            where: {
                organizationId,
                OR: [
                    { homeBaseId: baseId },
                    {
                        schedulableResource: {
                            bookings: {
                                some: { baseId, status: { not: client_1.BookingStatus.CANCELLED } },
                            },
                        },
                    },
                ],
            },
        });
    }
    async updateAirworthinessStatus(id, status) {
        const organizationId = this.requireOrganizationId();
        const existing = await this.prisma.aircraft.findFirst({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Aircraft with ID "${id}" not found.`);
        }
        return this.prisma.aircraft.update({
            where: { id },
            data: { airworthinessStatus: status },
        });
    }
};
exports.AircraftService = AircraftService;
exports.AircraftService = AircraftService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], AircraftService);
//# sourceMappingURL=aircraft.service.js.map