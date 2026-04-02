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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const graphql_1 = require("@nestjs/graphql");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const tenant_context_1 = require("../../prisma/tenant.context");
const dev_auth_config_1 = require("../dev-auth.config");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    config;
    prisma;
    moduleRef;
    constructor(config, prisma, moduleRef) {
        super();
        this.config = config;
        this.prisma = prisma;
        this.moduleRef = moduleRef;
    }
    getRequest(context) {
        const ctx = graphql_1.GqlExecutionContext.create(context);
        return ctx.getContext().req;
    }
    async canActivate(context) {
        if (!(0, dev_auth_config_1.isDevAuthBypassEnabled)(this.config)) {
            const ok = (await super.canActivate(context));
            if (ok) {
                await this.applyOrganizationContext(context);
            }
            return ok;
        }
        const req = this.getRequest(context);
        const authHeader = req.headers?.authorization;
        const hasBearer = typeof authHeader === 'string' && /^Bearer\s+\S+/i.test(authHeader);
        if (hasBearer) {
            try {
                const ok = (await super.canActivate(context));
                if (ok) {
                    await this.applyOrganizationContext(context);
                    return true;
                }
            }
            catch {
            }
        }
        req.user = await this.resolveDevUser();
        await this.applyOrganizationContext(context);
        return true;
    }
    async applyOrganizationContext(context) {
        const req = this.getRequest(context);
        const user = req.user;
        const organizationId = user?.organizationId;
        if (!organizationId) {
            return;
        }
        req.organizationId = organizationId;
        try {
            const contextId = core_1.ContextIdFactory.getByRequest(req);
            const tenantContext = await this.moduleRef.resolve(tenant_context_1.TenantContext, contextId);
            tenantContext.setOrganization(organizationId);
        }
        catch {
        }
    }
    parseDevRole(raw) {
        if (!raw?.trim()) {
            return client_1.Role.DISPATCHER;
        }
        const upper = raw.trim().toUpperCase();
        if (Object.values(client_1.Role).includes(upper)) {
            return upper;
        }
        return client_1.Role.DISPATCHER;
    }
    async resolveDevUser() {
        const configuredId = this.config.get('FLYOS_DEV_USER_ID')?.trim();
        if (configuredId) {
            const user = await this.prisma.user.findUnique({
                where: { id: configuredId },
            });
            if (!user) {
                throw new common_1.UnauthorizedException(`FLYOS_DEV_USER_ID="${configuredId}" does not match any user.`);
            }
            const roleEnv = this.config.get('FLYOS_DEV_USER_ROLE');
            return {
                userId: user.id,
                role: this.parseDevRole(roleEnv),
                organizationId: user.organizationId,
            };
        }
        const first = await this.prisma.user.findFirst({
            orderBy: { createdAt: 'asc' },
        });
        if (!first) {
            throw new common_1.UnauthorizedException('No users in the database yet. Restart the server so the dev user seed can run, or run register.');
        }
        return {
            userId: first.id,
            role: first.role,
            organizationId: first.organizationId,
        };
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        core_1.ModuleRef])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map