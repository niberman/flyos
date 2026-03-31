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
let MaintenanceService = class MaintenanceService {
    static { MaintenanceService_1 = this; }
    prisma;
    static MAX_CYLINDER_HEAD_TEMP = 400;
    static MIN_OIL_PRESSURE = 30;
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
        this.logger.log(`Scanning ${recentTelemetry.length} telemetry record(s)...`);
        const aircraftToGround = new Set();
        for (const record of recentTelemetry) {
            const sensorData = record.data;
            if (sensorData === null || typeof sensorData !== 'object') {
                continue;
            }
            if (sensorData.cylinderHeadTemperature !== undefined &&
                sensorData.cylinderHeadTemperature > MaintenanceService_1.MAX_CYLINDER_HEAD_TEMP) {
                this.logger.warn(`ALERT: Aircraft ${record.aircraft.tailNumber} (${record.aircraftId}) ` +
                    `has cylinder head temperature of ${sensorData.cylinderHeadTemperature}°F ` +
                    `(threshold: ${MaintenanceService_1.MAX_CYLINDER_HEAD_TEMP}°F). GROUNDING.`);
                aircraftToGround.add(record.aircraftId);
            }
            if (sensorData.oilPressure !== undefined &&
                sensorData.oilPressure < MaintenanceService_1.MIN_OIL_PRESSURE) {
                this.logger.warn(`ALERT: Aircraft ${record.aircraft.tailNumber} (${record.aircraftId}) ` +
                    `has oil pressure of ${sensorData.oilPressure} PSI ` +
                    `(threshold: ${MaintenanceService_1.MIN_OIL_PRESSURE} PSI). GROUNDING.`);
                aircraftToGround.add(record.aircraftId);
            }
        }
        if (aircraftToGround.size > 0) {
            const result = await this.prisma.aircraft.updateMany({
                where: {
                    id: { in: Array.from(aircraftToGround) },
                    airworthinessStatus: client_1.AirworthinessStatus.FLIGHT_READY,
                },
                data: {
                    airworthinessStatus: client_1.AirworthinessStatus.GROUNDED,
                },
            });
            this.logger.warn(`Predictive maintenance grounded ${result.count} aircraft: ` +
                `${Array.from(aircraftToGround).join(', ')}`);
        }
        else {
            this.logger.log('All telemetry within safe thresholds. No aircraft grounded.');
        }
        this.logger.log('Predictive maintenance scan complete.');
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