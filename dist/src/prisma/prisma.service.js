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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const tenant_context_1 = require("./tenant.context");
const tenant_middleware_1 = require("./tenant.middleware");
const MODEL_DELEGATES = [
    'user',
    'aircraft',
    'booking',
    'base',
    'organization',
    'maintenanceLog',
    'telemetry',
    'userBase',
];
let PrismaService = class PrismaService extends client_1.PrismaClient {
    config;
    constructor(config) {
        const databaseUrl = config.get('DATABASE_URL')?.trim();
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is missing or empty. Set it in your environment (e.g. .env).');
        }
        const adapter = new adapter_pg_1.PrismaPg(databaseUrl);
        super({ adapter });
        this.config = config;
    }
    async onModuleInit() {
        if (typeof this.$extends === 'function') {
            const extension = (0, tenant_middleware_1.createTenantExtension)(tenant_context_1.getRequestOrganizationId);
            const extended = this.$extends(extension);
            for (const name of MODEL_DELEGATES) {
                Object.defineProperty(this, name, {
                    get: () => extended[name],
                    configurable: true,
                });
            }
            const boundTransaction = extended.$transaction.bind(extended);
            Object.defineProperty(this, '$transaction', {
                value: boundTransaction,
                writable: true,
                configurable: true,
            });
        }
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map