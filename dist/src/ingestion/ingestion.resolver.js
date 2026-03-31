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
exports.IngestionResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const ingestion_service_1 = require("./ingestion.service");
const maintenance_log_type_1 = require("./maintenance-log.type");
const telemetry_type_1 = require("./telemetry.type");
const batch_maintenance_input_1 = require("./dto/batch-maintenance.input");
const batch_telemetry_input_1 = require("./dto/batch-telemetry.input");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let IngestionResolver = class IngestionResolver {
    ingestionService;
    constructor(ingestionService) {
        this.ingestionService = ingestionService;
    }
    async ingestMaintenanceLogs(input) {
        return this.ingestionService.ingestMaintenanceLogs(input);
    }
    async ingestTelemetry(input) {
        return this.ingestionService.ingestTelemetry(input);
    }
};
exports.IngestionResolver = IngestionResolver;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.INSTRUCTOR, client_1.Role.DISPATCHER),
    (0, graphql_1.Mutation)(() => [maintenance_log_type_1.MaintenanceLogType], {
        description: 'Batch upload maintenance log records. INSTRUCTOR and DISPATCHER only.',
    }),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [batch_maintenance_input_1.BatchMaintenanceInput]),
    __metadata("design:returntype", Promise)
], IngestionResolver.prototype, "ingestMaintenanceLogs", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.INSTRUCTOR, client_1.Role.DISPATCHER),
    (0, graphql_1.Mutation)(() => [telemetry_type_1.TelemetryType], {
        description: 'Batch upload telemetry sensor data. INSTRUCTOR and DISPATCHER only.',
    }),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [batch_telemetry_input_1.BatchTelemetryInput]),
    __metadata("design:returntype", Promise)
], IngestionResolver.prototype, "ingestTelemetry", null);
exports.IngestionResolver = IngestionResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [ingestion_service_1.IngestionService])
], IngestionResolver);
//# sourceMappingURL=ingestion.resolver.js.map