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
exports.MaintenanceLogType = void 0;
const graphql_1 = require("@nestjs/graphql");
const graphql_type_json_1 = require("graphql-type-json");
let MaintenanceLogType = class MaintenanceLogType {
    id;
    aircraftId;
    timestamp;
    data;
};
exports.MaintenanceLogType = MaintenanceLogType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, {
        description: 'Unique identifier for the maintenance log.',
    }),
    __metadata("design:type", String)
], MaintenanceLogType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'UUID of the associated aircraft.' }),
    __metadata("design:type", String)
], MaintenanceLogType.prototype, "aircraftId", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Timestamp of the maintenance log entry.' }),
    __metadata("design:type", Date)
], MaintenanceLogType.prototype, "timestamp", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_type_json_1.GraphQLJSON, {
        description: 'Raw JSONB maintenance log data as received from batch upload.',
    }),
    __metadata("design:type", Object)
], MaintenanceLogType.prototype, "data", void 0);
exports.MaintenanceLogType = MaintenanceLogType = __decorate([
    (0, graphql_1.ObjectType)('MaintenanceLog', {
        description: 'A maintenance log entry linked to a specific aircraft.',
    })
], MaintenanceLogType);
//# sourceMappingURL=maintenance-log.type.js.map