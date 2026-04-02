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
exports.SchedulableResourceType = void 0;
const graphql_1 = require("@nestjs/graphql");
const client_1 = require("@prisma/client");
const aircraft_type_1 = require("../aircraft/aircraft.type");
(0, graphql_1.registerEnumType)(client_1.SchedulableResourceKind, {
    name: 'SchedulableResourceKind',
    description: 'Kind of schedulable resource.',
});
let SchedulableResourceType = class SchedulableResourceType {
    id;
    kind;
    name;
    isActive;
    baseId;
    aircraft;
};
exports.SchedulableResourceType = SchedulableResourceType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], SchedulableResourceType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => client_1.SchedulableResourceKind),
    __metadata("design:type", String)
], SchedulableResourceType.prototype, "kind", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], SchedulableResourceType.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], SchedulableResourceType.prototype, "isActive", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], SchedulableResourceType.prototype, "baseId", void 0);
__decorate([
    (0, graphql_1.Field)(() => aircraft_type_1.AircraftType, { nullable: true }),
    __metadata("design:type", Object)
], SchedulableResourceType.prototype, "aircraft", void 0);
exports.SchedulableResourceType = SchedulableResourceType = __decorate([
    (0, graphql_1.ObjectType)('SchedulableResource')
], SchedulableResourceType);
//# sourceMappingURL=schedulable-resource.type.js.map