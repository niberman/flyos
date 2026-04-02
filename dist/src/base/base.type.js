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
exports.BaseType = void 0;
const graphql_1 = require("@nestjs/graphql");
let BaseType = class BaseType {
    id;
    organizationId;
    name;
    icaoCode;
    timezone;
    createdAt;
    updatedAt;
};
exports.BaseType = BaseType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { description: 'Unique identifier (UUID) for the base.' }),
    __metadata("design:type", String)
], BaseType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'UUID of the organization this base belongs to.' }),
    __metadata("design:type", String)
], BaseType.prototype, "organizationId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Name of the base.' }),
    __metadata("design:type", String)
], BaseType.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'ICAO airport code (e.g., KAPA, KBJC).' }),
    __metadata("design:type", String)
], BaseType.prototype, "icaoCode", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'IANA timezone identifier (e.g., America/Denver).' }),
    __metadata("design:type", String)
], BaseType.prototype, "timezone", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Timestamp when the base was created.' }),
    __metadata("design:type", Date)
], BaseType.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Timestamp of the last update to the base record.' }),
    __metadata("design:type", Date)
], BaseType.prototype, "updatedAt", void 0);
exports.BaseType = BaseType = __decorate([
    (0, graphql_1.ObjectType)('Base', {
        description: 'A physical airport or flight base operated by an organization.',
    })
], BaseType);
//# sourceMappingURL=base.type.js.map