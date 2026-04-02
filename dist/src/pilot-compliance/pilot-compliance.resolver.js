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
exports.PilotComplianceResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
const pilot_medical_type_1 = require("./pilot-medical.type");
const flight_review_type_1 = require("./flight-review.type");
const aircraft_checkout_type_1 = require("./aircraft-checkout.type");
let PilotComplianceResolver = class PilotComplianceResolver {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async orgId(userId) {
        const u = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true },
        });
        if (!u)
            throw new common_1.UnauthorizedException('User not found.');
        return u.organizationId;
    }
    async upsertPilotMedical(user, targetUserId, medicalClass, expiresAt) {
        const organizationId = await this.orgId(user.userId);
        await this.prisma.pilotMedical.deleteMany({
            where: { userId: targetUserId, organizationId },
        });
        const row = await this.prisma.pilotMedical.create({
            data: {
                userId: targetUserId,
                organizationId,
                class: medicalClass,
                expiresAt,
            },
        });
        return {
            ...row,
            medicalClass: row.class,
        };
    }
    async upsertFlightReview(user, targetUserId, completedAt, expiresAt) {
        const organizationId = await this.orgId(user.userId);
        await this.prisma.flightReviewRecord.deleteMany({
            where: { userId: targetUserId, organizationId },
        });
        return this.prisma.flightReviewRecord.create({
            data: {
                userId: targetUserId,
                organizationId,
                completedAt,
                expiresAt,
            },
        });
    }
    async upsertAircraftCheckout(user, targetUserId, aircraftId, expiresAt) {
        const organizationId = await this.orgId(user.userId);
        await this.prisma.aircraftCheckout.deleteMany({
            where: { userId: targetUserId, aircraftId, organizationId },
        });
        return this.prisma.aircraftCheckout.create({
            data: {
                userId: targetUserId,
                aircraftId,
                organizationId,
                expiresAt,
            },
        });
    }
};
exports.PilotComplianceResolver = PilotComplianceResolver;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.DISPATCHER),
    (0, graphql_1.Mutation)(() => pilot_medical_type_1.PilotMedicalType, {
        description: 'Create or replace the latest pilot medical for a user (dispatcher).',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('userId', { type: () => graphql_1.ID })),
    __param(2, (0, graphql_1.Args)('medicalClass', { type: () => String })),
    __param(3, (0, graphql_1.Args)('expiresAt', { type: () => Date })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Date]),
    __metadata("design:returntype", Promise)
], PilotComplianceResolver.prototype, "upsertPilotMedical", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.DISPATCHER),
    (0, graphql_1.Mutation)(() => flight_review_type_1.FlightReviewType, {
        description: 'Create or replace the latest flight review for a user (dispatcher).',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('userId', { type: () => graphql_1.ID })),
    __param(2, (0, graphql_1.Args)('completedAt', { type: () => Date })),
    __param(3, (0, graphql_1.Args)('expiresAt', { type: () => Date })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Date,
        Date]),
    __metadata("design:returntype", Promise)
], PilotComplianceResolver.prototype, "upsertFlightReview", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.DISPATCHER),
    (0, graphql_1.Mutation)(() => aircraft_checkout_type_1.AircraftCheckoutType, {
        description: 'Create or replace aircraft checkout for a user (dispatcher).',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('userId', { type: () => graphql_1.ID })),
    __param(2, (0, graphql_1.Args)('aircraftId', { type: () => graphql_1.ID })),
    __param(3, (0, graphql_1.Args)('expiresAt', { type: () => Date })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Date]),
    __metadata("design:returntype", Promise)
], PilotComplianceResolver.prototype, "upsertAircraftCheckout", null);
exports.PilotComplianceResolver = PilotComplianceResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PilotComplianceResolver);
//# sourceMappingURL=pilot-compliance.resolver.js.map