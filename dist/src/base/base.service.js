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
exports.BaseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant.context");
let BaseService = class BaseService {
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
    async findAll() {
        const organizationId = this.requireOrganizationId();
        return this.prisma.base.findMany({
            where: { organizationId },
            orderBy: { name: 'asc' },
        });
    }
    async findById(id) {
        const organizationId = this.requireOrganizationId();
        return this.prisma.base.findFirst({
            where: { id, organizationId },
        });
    }
    async create(input) {
        const organizationId = this.requireOrganizationId();
        const icaoCode = input.icaoCode.trim().toUpperCase();
        const duplicate = await this.prisma.base.findFirst({
            where: { organizationId, icaoCode },
        });
        if (duplicate) {
            throw new common_1.ConflictException(`A base with ICAO code ${icaoCode} already exists in your organization.`);
        }
        return this.prisma.base.create({
            data: {
                organizationId,
                name: input.name.trim(),
                icaoCode,
                timezone: input.timezone.trim(),
            },
        });
    }
};
exports.BaseService = BaseService;
exports.BaseService = BaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], BaseService);
//# sourceMappingURL=base.service.js.map