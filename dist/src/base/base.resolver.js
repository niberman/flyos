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
exports.BaseResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const base_type_1 = require("./base.type");
const base_service_1 = require("./base.service");
const create_base_input_1 = require("./dto/create-base.input");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant.context");
let BaseResolver = class BaseResolver {
    baseService;
    prisma;
    tenantContext;
    constructor(baseService, prisma, tenantContext) {
        this.baseService = baseService;
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
    async bases(user) {
        await this.bindTenantContext(user);
        return this.baseService.findAll();
    }
    async createBase(user, input) {
        await this.bindTenantContext(user);
        return this.baseService.create(input);
    }
};
exports.BaseResolver = BaseResolver;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, graphql_1.Query)(() => [base_type_1.BaseType], {
        description: 'List all bases in the organization.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BaseResolver.prototype, "bases", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.DISPATCHER),
    (0, graphql_1.Mutation)(() => base_type_1.BaseType, {
        description: 'Create a new base. DISPATCHER only.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_base_input_1.CreateBaseInput]),
    __metadata("design:returntype", Promise)
], BaseResolver.prototype, "createBase", null);
exports.BaseResolver = BaseResolver = __decorate([
    (0, graphql_1.Resolver)(() => base_type_1.BaseType),
    __metadata("design:paramtypes", [base_service_1.BaseService,
        prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], BaseResolver);
//# sourceMappingURL=base.resolver.js.map