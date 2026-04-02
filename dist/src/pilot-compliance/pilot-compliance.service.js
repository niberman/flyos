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
exports.PilotComplianceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let PilotComplianceService = class PilotComplianceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assertEligibleForBooking(organizationId, ctx) {
        const renter = await this.prisma.user.findFirst({
            where: { id: ctx.renterUserId, organizationId },
        });
        if (!renter) {
            throw new common_1.BadRequestException('Renter user not found in your organization.');
        }
        const med = await this.prisma.pilotMedical.findFirst({
            where: {
                userId: ctx.renterUserId,
                expiresAt: { gte: ctx.startTime },
            },
            orderBy: { expiresAt: 'desc' },
        });
        if (!med) {
            throw new common_1.BadRequestException('Renter does not have a pilot medical on file that is valid for this booking start time.');
        }
        const fr = await this.prisma.flightReviewRecord.findFirst({
            where: {
                userId: ctx.renterUserId,
                expiresAt: { gte: ctx.startTime },
            },
            orderBy: { expiresAt: 'desc' },
        });
        if (!fr) {
            throw new common_1.BadRequestException('Renter does not have a flight review record valid for this booking start time.');
        }
        if (ctx.aircraftId) {
            const checkout = await this.prisma.aircraftCheckout.findFirst({
                where: {
                    userId: ctx.renterUserId,
                    aircraftId: ctx.aircraftId,
                    expiresAt: { gte: ctx.startTime },
                },
                orderBy: { expiresAt: 'desc' },
            });
            if (!checkout) {
                throw new common_1.BadRequestException('Renter does not have a current aircraft checkout for this aircraft.');
            }
        }
        if (ctx.instructorUserId && renter.role === client_1.Role.STUDENT) {
            const inst = await this.prisma.user.findFirst({
                where: { id: ctx.instructorUserId, organizationId },
            });
            if (!inst) {
                throw new common_1.BadRequestException('Instructor user not found in your organization.');
            }
            const instMed = await this.prisma.pilotMedical.findFirst({
                where: {
                    userId: ctx.instructorUserId,
                    expiresAt: { gte: ctx.startTime },
                },
                orderBy: { expiresAt: 'desc' },
            });
            if (!instMed) {
                throw new common_1.BadRequestException('Instructor does not have a pilot medical on file valid for this booking (required when flying with a student pilot).');
            }
        }
    }
};
exports.PilotComplianceService = PilotComplianceService;
exports.PilotComplianceService = PilotComplianceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PilotComplianceService);
//# sourceMappingURL=pilot-compliance.service.js.map