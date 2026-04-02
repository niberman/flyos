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
exports.Alert = void 0;
const graphql_1 = require("@nestjs/graphql");
let Alert = class Alert {
    aircraftId;
    aircraftTailNumber;
    parameter;
    value;
    threshold;
    timestamp;
};
exports.Alert = Alert;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { description: 'Aircraft that recorded the violation.' }),
    __metadata("design:type", String)
], Alert.prototype, "aircraftId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Tail number of the aircraft.' }),
    __metadata("design:type", String)
], Alert.prototype, "aircraftTailNumber", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, {
        description: 'Sensor parameter that violated a threshold.',
    }),
    __metadata("design:type", String)
], Alert.prototype, "parameter", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { description: 'Recorded sensor value.' }),
    __metadata("design:type", Number)
], Alert.prototype, "value", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, {
        description: 'Threshold limit that was exceeded (min or max as applicable).',
    }),
    __metadata("design:type", Number)
], Alert.prototype, "threshold", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Telemetry record timestamp.' }),
    __metadata("design:type", Date)
], Alert.prototype, "timestamp", void 0);
exports.Alert = Alert = __decorate([
    (0, graphql_1.ObjectType)('Alert', {
        description: 'A telemetry threshold violation for an aircraft, for operator visibility.',
    })
], Alert);
//# sourceMappingURL=alert.type.js.map