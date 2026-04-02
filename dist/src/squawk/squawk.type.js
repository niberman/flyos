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
exports.SquawkType = void 0;
const graphql_1 = require("@nestjs/graphql");
const client_1 = require("@prisma/client");
(0, graphql_1.registerEnumType)(client_1.SquawkStatus, {
    name: 'SquawkStatus',
    description: 'Lifecycle of a maintenance squawk.',
});
let SquawkType = class SquawkType {
    id;
    aircraftId;
    title;
    description;
    status;
    groundsAircraft;
    createdAt;
    clearedAt;
};
exports.SquawkType = SquawkType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], SquawkType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], SquawkType.prototype, "aircraftId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], SquawkType.prototype, "title", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", Object)
], SquawkType.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => client_1.SquawkStatus),
    __metadata("design:type", String)
], SquawkType.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], SquawkType.prototype, "groundsAircraft", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    __metadata("design:type", Date)
], SquawkType.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { nullable: true }),
    __metadata("design:type", Object)
], SquawkType.prototype, "clearedAt", void 0);
exports.SquawkType = SquawkType = __decorate([
    (0, graphql_1.ObjectType)('Squawk')
], SquawkType);
//# sourceMappingURL=squawk.type.js.map