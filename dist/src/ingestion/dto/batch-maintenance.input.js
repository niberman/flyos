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
exports.BatchMaintenanceInput = exports.MaintenanceLogEntry = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
const graphql_type_json_1 = require("graphql-type-json");
let MaintenanceLogEntry = class MaintenanceLogEntry {
    aircraftId;
    timestamp;
    data;
};
exports.MaintenanceLogEntry = MaintenanceLogEntry;
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'UUID of the target aircraft.' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MaintenanceLogEntry.prototype, "aircraftId", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, {
        nullable: true,
        description: 'Timestamp of the log entry. Defaults to now if omitted.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], MaintenanceLogEntry.prototype, "timestamp", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_type_json_1.GraphQLJSON, {
        description: 'Raw maintenance log data (arbitrary JSON structure).',
    }),
    __metadata("design:type", Object)
], MaintenanceLogEntry.prototype, "data", void 0);
exports.MaintenanceLogEntry = MaintenanceLogEntry = __decorate([
    (0, graphql_1.InputType)({
        description: 'A single maintenance log entry within a batch upload.',
    })
], MaintenanceLogEntry);
let BatchMaintenanceInput = class BatchMaintenanceInput {
    entries;
};
exports.BatchMaintenanceInput = BatchMaintenanceInput;
__decorate([
    (0, graphql_1.Field)(() => [MaintenanceLogEntry], {
        description: 'Array of maintenance log entries to ingest.',
    }),
    __metadata("design:type", Array)
], BatchMaintenanceInput.prototype, "entries", void 0);
exports.BatchMaintenanceInput = BatchMaintenanceInput = __decorate([
    (0, graphql_1.InputType)({ description: 'Input for batch uploading maintenance log records.' })
], BatchMaintenanceInput);
//# sourceMappingURL=batch-maintenance.input.js.map