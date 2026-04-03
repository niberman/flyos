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
exports.AircraftType = void 0;
const graphql_1 = require("@nestjs/graphql");
const client_1 = require("@prisma/client");
const base_type_1 = require("../base/base.type");
(0, graphql_1.registerEnumType)(client_1.AirworthinessStatus, {
    name: 'AirworthinessStatus',
    description: 'Indicates whether an aircraft is cleared for flight operations.',
});
let AircraftType = class AircraftType {
    id;
    tailNumber;
    make;
    model;
    airworthinessStatus;
    organizationId;
    homeBaseId;
    homeBase;
    createdAt;
    updatedAt;
};
exports.AircraftType = AircraftType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, {
        description: 'Unique identifier (UUID) for the aircraft.',
    }),
    __metadata("design:type", String)
], AircraftType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, {
        description: 'FAA tail number uniquely identifying the aircraft (e.g., N12345).',
    }),
    __metadata("design:type", String)
], AircraftType.prototype, "tailNumber", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, {
        description: 'Aircraft manufacturer (e.g., Cessna, Piper).',
    }),
    __metadata("design:type", String)
], AircraftType.prototype, "make", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, {
        description: 'Aircraft model (e.g., 172 Skyhawk, PA-28 Cherokee).',
    }),
    __metadata("design:type", String)
], AircraftType.prototype, "model", void 0);
__decorate([
    (0, graphql_1.Field)(() => client_1.AirworthinessStatus, {
        description: 'Current airworthiness status. Automatically set to GROUNDED by the predictive maintenance engine when telemetry thresholds are violated.',
    }),
    __metadata("design:type", String)
], AircraftType.prototype, "airworthinessStatus", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, {
        description: 'UUID of the organization this aircraft belongs to.',
    }),
    __metadata("design:type", String)
], AircraftType.prototype, "organizationId", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, {
        description: 'UUID of the default home base for this aircraft.',
    }),
    __metadata("design:type", String)
], AircraftType.prototype, "homeBaseId", void 0);
__decorate([
    (0, graphql_1.Field)(() => base_type_1.BaseType, {
        description: 'The aircraft home base.',
    }),
    __metadata("design:type", base_type_1.BaseType)
], AircraftType.prototype, "homeBase", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, {
        description: 'Timestamp when the aircraft record was created.',
    }),
    __metadata("design:type", Date)
], AircraftType.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, {
        description: 'Timestamp of the last update to the aircraft record.',
    }),
    __metadata("design:type", Date)
], AircraftType.prototype, "updatedAt", void 0);
exports.AircraftType = AircraftType = __decorate([
    (0, graphql_1.ObjectType)('Aircraft', {
        description: 'An aircraft in the flight school fleet.',
    })
], AircraftType);
//# sourceMappingURL=aircraft.type.js.map