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
exports.AircraftResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const aircraft_type_1 = require("./aircraft.type");
const base_type_1 = require("./base.type");
const aircraft_service_1 = require("./aircraft.service");
const create_aircraft_input_1 = require("./dto/create-aircraft.input");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant.context");
let AircraftResolver = class AircraftResolver {
    aircraftService;
    prisma;
    tenantContext;
    constructor(aircraftService, prisma, tenantContext) {
        this.aircraftService = aircraftService;
        this.prisma = prisma;
        this.tenantContext = tenantContext;
    }
    async bindTenantContext(user) {
        const row = await this.prisma.user.findUnique({
            where: { id: user.userId },
            select: { organizationId: true },
        });
        if (!row) {
            throw new common_1.UnauthorizedException();
        }
        this.tenantContext.setOrganization(row.organizationId);
    }
    async aircraft(user, baseId) {
        await this.bindTenantContext(user);
        return this.aircraftService.findAll(baseId ?? undefined);
    }
    async aircraftByBase(user, baseId) {
        await this.bindTenantContext(user);
        return this.aircraftService.findByBase(baseId);
    }
    async homeBase(aircraft) {
        const row = await this.prisma.base.findFirst({
            where: {
                id: aircraft.homeBaseId,
                organizationId: aircraft.organizationId,
            },
            select: {
                id: true,
                name: true,
                icaoCode: true,
                timezone: true,
            },
        });
        if (!row) {
            throw new common_1.NotFoundException('Home base not found for this aircraft.');
        }
        return row;
    }
    async createAircraft(user, input) {
        await this.bindTenantContext(user);
        return this.aircraftService.create(input);
    }
    async updateAircraftStatus(user, id, status) {
        await this.bindTenantContext(user);
        return this.aircraftService.updateAirworthinessStatus(id, status);
    }
};
exports.AircraftResolver = AircraftResolver;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, graphql_1.Query)(() => [aircraft_type_1.AircraftType], {
        description: 'List all aircraft in the fleet.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('baseId', { type: () => graphql_1.ID, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AircraftResolver.prototype, "aircraft", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, graphql_1.Query)(() => [aircraft_type_1.AircraftType], {
        description: 'List aircraft at a base: home-based there or with a booking at that base.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('baseId', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AircraftResolver.prototype, "aircraftByBase", null);
__decorate([
    (0, graphql_1.ResolveField)(() => base_type_1.BaseType),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [aircraft_type_1.AircraftType]),
    __metadata("design:returntype", Promise)
], AircraftResolver.prototype, "homeBase", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.DISPATCHER),
    (0, graphql_1.Mutation)(() => aircraft_type_1.AircraftType, {
        description: 'Add a new aircraft to the fleet. DISPATCHER only.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_aircraft_input_1.CreateAircraftInput]),
    __metadata("design:returntype", Promise)
], AircraftResolver.prototype, "createAircraft", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.INSTRUCTOR, client_1.Role.DISPATCHER),
    (0, graphql_1.Mutation)(() => aircraft_type_1.AircraftType, {
        description: 'Update aircraft airworthiness status. INSTRUCTOR and DISPATCHER only.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __param(2, (0, graphql_1.Args)('status', { type: () => client_1.AirworthinessStatus })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AircraftResolver.prototype, "updateAircraftStatus", null);
exports.AircraftResolver = AircraftResolver = __decorate([
    (0, graphql_1.Resolver)(() => aircraft_type_1.AircraftType),
    __metadata("design:paramtypes", [aircraft_service_1.AircraftService,
        prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], AircraftResolver);
//# sourceMappingURL=aircraft.resolver.js.map