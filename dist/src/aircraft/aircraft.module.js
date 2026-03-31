"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AircraftModule = void 0;
const common_1 = require("@nestjs/common");
const aircraft_service_1 = require("./aircraft.service");
const aircraft_resolver_1 = require("./aircraft.resolver");
let AircraftModule = class AircraftModule {
};
exports.AircraftModule = AircraftModule;
exports.AircraftModule = AircraftModule = __decorate([
    (0, common_1.Module)({
        providers: [aircraft_service_1.AircraftService, aircraft_resolver_1.AircraftResolver],
        exports: [aircraft_service_1.AircraftService],
    })
], AircraftModule);
//# sourceMappingURL=aircraft.module.js.map