"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContext = exports.tenantStorage = void 0;
exports.getRequestOrganizationId = getRequestOrganizationId;
exports.runWithTenantContext = runWithTenantContext;
const async_hooks_1 = require("async_hooks");
const common_1 = require("@nestjs/common");
exports.tenantStorage = new async_hooks_1.AsyncLocalStorage();
function getRequestOrganizationId() {
    return exports.tenantStorage.getStore()?.organizationId ?? null;
}
function runWithTenantContext(store, fn) {
    return exports.tenantStorage.run(store, fn);
}
let TenantContext = class TenantContext {
    _organizationId = null;
    _baseId = null;
    get organizationId() {
        return (exports.tenantStorage.getStore()?.organizationId ?? this._organizationId);
    }
    get baseId() {
        return exports.tenantStorage.getStore()?.baseId ?? this._baseId;
    }
    setOrganization(organizationId) {
        this._organizationId = organizationId;
        const prev = exports.tenantStorage.getStore();
        exports.tenantStorage.enterWith({
            organizationId,
            baseId: prev?.baseId ?? this._baseId ?? undefined,
        });
    }
    setBase(baseId) {
        this._baseId = baseId;
        const org = exports.tenantStorage.getStore()?.organizationId ?? this._organizationId;
        if (!org) {
            return;
        }
        exports.tenantStorage.enterWith({
            organizationId: org,
            baseId,
        });
    }
};
exports.TenantContext = TenantContext;
exports.TenantContext = TenantContext = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST })
], TenantContext);
//# sourceMappingURL=tenant.context.js.map