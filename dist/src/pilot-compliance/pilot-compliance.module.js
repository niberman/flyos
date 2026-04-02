"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PilotComplianceModule = void 0;
const common_1 = require("@nestjs/common");
const pilot_compliance_service_1 = require("./pilot-compliance.service");
const pilot_compliance_resolver_1 = require("./pilot-compliance.resolver");
let PilotComplianceModule = class PilotComplianceModule {
};
exports.PilotComplianceModule = PilotComplianceModule;
exports.PilotComplianceModule = PilotComplianceModule = __decorate([
    (0, common_1.Module)({
        providers: [pilot_compliance_service_1.PilotComplianceService, pilot_compliance_resolver_1.PilotComplianceResolver],
        exports: [pilot_compliance_service_1.PilotComplianceService],
    })
], PilotComplianceModule);
//# sourceMappingURL=pilot-compliance.module.js.map