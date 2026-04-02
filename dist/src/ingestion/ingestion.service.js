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
exports.IngestionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let IngestionService = class IngestionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ingestMaintenanceLogs(input, organizationId) {
        const aircraftIds = [...new Set(input.entries.map((e) => e.aircraftId))];
        const existingAircraft = await this.prisma.aircraft.findMany({
            where: { id: { in: aircraftIds }, organizationId },
            select: { id: true },
        });
        const existingIds = new Set(existingAircraft.map((a) => a.id));
        const missingIds = aircraftIds.filter((id) => !existingIds.has(id));
        if (missingIds.length > 0) {
            throw new common_1.BadRequestException(`The following aircraft IDs do not exist or do not belong to your organization: ${missingIds.join(', ')}`);
        }
        const created = await this.prisma.$transaction(input.entries.map((entry) => this.prisma.maintenanceLog.create({
            data: {
                aircraftId: entry.aircraftId,
                organizationId,
                timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
                data: entry.data,
            },
        })));
        return created;
    }
    async ingestTelemetry(input, organizationId) {
        const aircraftIds = [...new Set(input.entries.map((e) => e.aircraftId))];
        const existingAircraft = await this.prisma.aircraft.findMany({
            where: { id: { in: aircraftIds }, organizationId },
            select: { id: true },
        });
        const existingIds = new Set(existingAircraft.map((a) => a.id));
        const missingIds = aircraftIds.filter((id) => !existingIds.has(id));
        if (missingIds.length > 0) {
            throw new common_1.BadRequestException(`The following aircraft IDs do not exist or do not belong to your organization: ${missingIds.join(', ')}`);
        }
        const created = await this.prisma.$transaction(input.entries.map((entry) => this.prisma.telemetry.create({
            data: {
                aircraftId: entry.aircraftId,
                organizationId,
                timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
                data: entry.data,
            },
        })));
        return created;
    }
};
exports.IngestionService = IngestionService;
exports.IngestionService = IngestionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IngestionService);
//# sourceMappingURL=ingestion.service.js.map