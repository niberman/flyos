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
exports.BatchTelemetryInput = exports.TelemetryEntry = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const graphql_type_json_1 = require("graphql-type-json");
let TelemetryEntry = class TelemetryEntry {
    aircraftId;
    timestamp;
    data;
};
exports.TelemetryEntry = TelemetryEntry;
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'UUID of the target aircraft.' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TelemetryEntry.prototype, "aircraftId", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, {
        nullable: true,
        description: 'Timestamp of the sensor reading. Defaults to now if omitted.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], TelemetryEntry.prototype, "timestamp", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_type_json_1.GraphQLJSON, {
        description: 'Raw sensor data (e.g., { oilPressure: 45, cylinderHeadTemperature: 380 }).',
    }),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], TelemetryEntry.prototype, "data", void 0);
exports.TelemetryEntry = TelemetryEntry = __decorate([
    (0, graphql_1.InputType)({
        description: 'A single telemetry data entry within a batch upload. Aircraft must belong to the caller organization.',
    })
], TelemetryEntry);
let BatchTelemetryInput = class BatchTelemetryInput {
    entries;
};
exports.BatchTelemetryInput = BatchTelemetryInput;
__decorate([
    (0, graphql_1.Field)(() => [TelemetryEntry], {
        description: 'Array of telemetry data entries to ingest.',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TelemetryEntry),
    __metadata("design:type", Array)
], BatchTelemetryInput.prototype, "entries", void 0);
exports.BatchTelemetryInput = BatchTelemetryInput = __decorate([
    (0, graphql_1.InputType)({ description: 'Input for batch uploading telemetry records.' })
], BatchTelemetryInput);
//# sourceMappingURL=batch-telemetry.input.js.map