"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDevAuthBypassEnabled = isDevAuthBypassEnabled;
function isDevAuthBypassEnabled(config) {
    if (config.get('NODE_ENV') === 'production') {
        return false;
    }
    if (config.get('FLYOS_STRICT_AUTH') === 'true') {
        return false;
    }
    if (config.get('FLYOS_DEV_MODE') === 'false') {
        return false;
    }
    return true;
}
//# sourceMappingURL=dev-auth.config.js.map