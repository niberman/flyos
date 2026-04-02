"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SquawkModule = void 0;
const common_1 = require("@nestjs/common");
const squawk_service_1 = require("./squawk.service");
const squawk_resolver_1 = require("./squawk.resolver");
let SquawkModule = class SquawkModule {
};
exports.SquawkModule = SquawkModule;
exports.SquawkModule = SquawkModule = __decorate([
    (0, common_1.Module)({
        providers: [squawk_service_1.SquawkService, squawk_resolver_1.SquawkResolver],
        exports: [squawk_service_1.SquawkService],
    })
], SquawkModule);
//# sourceMappingURL=squawk.module.js.map