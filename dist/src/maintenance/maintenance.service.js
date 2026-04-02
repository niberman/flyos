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
var MaintenanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const thresholds_config_1 = require("./thresholds.config");
let MaintenanceService = MaintenanceService_1 = class MaintenanceService {
    prisma;
    logger = new common_1.Logger(MaintenanceService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkTelemetryThresholds() {
        this.logger.log('Predictive maintenance scan started...');
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentTelemetry = await this.prisma.telemetry.findMany({
            where: {
                timestamp: { gte: fiveMinutesAgo },
            },
            include: {
                aircraft: true,
            },
        });
        if (recentTelemetry.length === 0) {
            this.logger.log('No recent telemetry records found. Scan complete.');
            return;
        }
        this.logger.log(`Scanning ${recentTelemetry.length} telemetry record(s) across organizations...`);
        const byOrg = new Map();
        for (const record of recentTelemetry) {
            const oid = record.organizationId;
            const list = byOrg.get(oid);
            if (list) {
                list.push(record);
            }
            else {
                byOrg.set(oid, [record]);
            }
        }
        for (const [organizationId, records] of byOrg) {
            await this.processOrgTelemetryWindow(organizationId, records);
        }
        this.logger.log('Predictive maintenance scan complete.');
    }
    async processOrgTelemetryWindow(organizationId, records) {
        const aircraftToGround = new Set();
        for (const record of records) {
            const violations = (0, thresholds_config_1.evaluateTelemetryViolations)(record.data, thresholds_config_1.DEFAULT_THRESHOLDS);
            for (const v of violations) {
                const isLowBound = v.parameter === 'oilPressure' ||
                    (v.parameter === 'fuelFlow' && v.value < v.threshold);
                this.logger.warn(`ALERT: [org=${organizationId}] Aircraft ${record.aircraft.tailNumber} (${record.aircraftId}) — ` +
                    `${v.parameter}=${v.value} ${isLowBound ? 'below' : 'above'} threshold ${v.threshold}. GROUNDING.`);
                aircraftToGround.add(record.aircraftId);
            }
        }
        if (aircraftToGround.size > 0) {
            const result = await this.prisma.aircraft.updateMany({
                where: {
                    id: { in: Array.from(aircraftToGround) },
                    organizationId,
                    airworthinessStatus: client_1.AirworthinessStatus.FLIGHT_READY,
                },
                data: {
                    airworthinessStatus: client_1.AirworthinessStatus.GROUNDED,
                },
            });
            this.logger.warn(`Predictive maintenance grounded ${result.count} aircraft in org ${organizationId}: ` +
                `${Array.from(aircraftToGround).join(', ')}`);
        }
        else {
            this.logger.log(`Organization ${organizationId}: all telemetry within safe thresholds.`);
        }
    }
    async getAlertHistory(organizationId, aircraftId, hours = 24) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        const records = await this.prisma.telemetry.findMany({
            where: {
                organizationId,
                timestamp: { gte: since },
                ...(aircraftId ? { aircraftId } : {}),
            },
            include: { aircraft: true },
            orderBy: { timestamp: 'desc' },
        });
        const alerts = [];
        for (const r of records) {
            const violations = (0, thresholds_config_1.evaluateTelemetryViolations)(r.data, thresholds_config_1.DEFAULT_THRESHOLDS);
            for (const v of violations) {
                alerts.push({
                    aircraftId: r.aircraftId,
                    aircraftTailNumber: r.aircraft.tailNumber,
                    parameter: v.parameter,
                    value: v.value,
                    threshold: v.threshold,
                    timestamp: r.timestamp,
                });
            }
        }
        return alerts;
    }
};
exports.MaintenanceService = MaintenanceService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MaintenanceService.prototype, "checkTelemetryThresholds", null);
exports.MaintenanceService = MaintenanceService = MaintenanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaintenanceService);
//# sourceMappingURL=maintenance.service.js.map