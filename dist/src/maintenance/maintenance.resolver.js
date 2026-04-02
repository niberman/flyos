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
exports.MaintenanceResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const maintenance_service_1 = require("./maintenance.service");
const alert_type_1 = require("./alert.type");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let MaintenanceResolver = class MaintenanceResolver {
    maintenanceService;
    prisma;
    constructor(maintenanceService, prisma) {
        this.maintenanceService = maintenanceService;
        this.prisma = prisma;
    }
    async alertHistory(user, aircraftId, hours) {
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.userId },
            select: { organizationId: true },
        });
        if (!dbUser) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.maintenanceService.getAlertHistory(dbUser.organizationId, aircraftId, hours ?? 24);
    }
};
exports.MaintenanceResolver = MaintenanceResolver;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.INSTRUCTOR, client_1.Role.DISPATCHER),
    (0, graphql_1.Query)(() => [alert_type_1.Alert], {
        description: 'Telemetry threshold violations for the current organization. Defaults to the last 24 hours.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('aircraftId', { type: () => graphql_1.ID, nullable: true })),
    __param(2, (0, graphql_1.Args)('hours', { type: () => graphql_1.Int, nullable: true, defaultValue: 24 })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], MaintenanceResolver.prototype, "alertHistory", null);
exports.MaintenanceResolver = MaintenanceResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [maintenance_service_1.MaintenanceService,
        prisma_service_1.PrismaService])
], MaintenanceResolver);
//# sourceMappingURL=maintenance.resolver.js.map