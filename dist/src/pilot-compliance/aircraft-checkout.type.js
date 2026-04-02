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
exports.AircraftCheckoutType = void 0;
const graphql_1 = require("@nestjs/graphql");
let AircraftCheckoutType = class AircraftCheckoutType {
    id;
    userId;
    aircraftId;
    expiresAt;
};
exports.AircraftCheckoutType = AircraftCheckoutType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], AircraftCheckoutType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], AircraftCheckoutType.prototype, "userId", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], AircraftCheckoutType.prototype, "aircraftId", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    __metadata("design:type", Date)
], AircraftCheckoutType.prototype, "expiresAt", void 0);
exports.AircraftCheckoutType = AircraftCheckoutType = __decorate([
    (0, graphql_1.ObjectType)('AircraftCheckout')
], AircraftCheckoutType);
//# sourceMappingURL=aircraft-checkout.type.js.map