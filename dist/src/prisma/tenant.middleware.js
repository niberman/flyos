"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTenantMiddleware = void 0;
exports.createTenantExtension = createTenantExtension;
const client_1 = require("@prisma/client");
const DIRECTLY_SCOPED_MODELS = new Set([
    'User',
    'Base',
    'Aircraft',
    'MaintenanceLog',
    'Telemetry',
    'SchedulableResource',
    'Squawk',
    'BookingParticipant',
    'PilotMedical',
    'PilotCertificate',
    'FlightReviewRecord',
    'AircraftCheckout',
]);
const BASE_SCOPED_MODELS = new Set([
    'Booking',
    'UserBase',
]);
const FILTERED_ACTIONS = new Set([
    'findMany',
    'findFirst',
    'findFirstOrThrow',
    'findUnique',
    'findUniqueOrThrow',
    'update',
    'updateMany',
    'delete',
    'deleteMany',
    'count',
    'aggregate',
    'groupBy',
]);
function mergeWhere(existing, tenantClause) {
    if (!existing || Object.keys(existing).length === 0) {
        return tenantClause;
    }
    return { AND: [existing, tenantClause] };
}
function createTenantExtension(getOrganizationId) {
    return client_1.Prisma.defineExtension({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const organizationId = getOrganizationId();
                    if (!organizationId) {
                        return query(args);
                    }
                    const op = args;
                    if (model === 'Organization') {
                        return query(args);
                    }
                    if (model === 'User') {
                        if (operation === 'findUnique' ||
                            operation === 'findUniqueOrThrow') {
                            return query(args);
                        }
                        if (operation === 'upsert') {
                            const nextArgs = { ...op };
                            if (nextArgs.create) {
                                nextArgs.create = {
                                    ...nextArgs.create,
                                    organizationId,
                                };
                            }
                            return query(nextArgs);
                        }
                    }
                    if (BASE_SCOPED_MODELS.has(model)) {
                        if (FILTERED_ACTIONS.has(operation)) {
                            const tenantClause = { base: { organizationId } };
                            op.where = mergeWhere(op.where, tenantClause);
                        }
                        return query(op);
                    }
                    if (!DIRECTLY_SCOPED_MODELS.has(model)) {
                        return query(args);
                    }
                    if (FILTERED_ACTIONS.has(operation)) {
                        op.where = mergeWhere(op.where, { organizationId });
                    }
                    if (operation === 'create') {
                        op.data = {
                            ...op.data,
                            organizationId,
                        };
                    }
                    if (operation === 'createMany') {
                        const data = op.data;
                        if (Array.isArray(data)) {
                            op.data = data.map((record) => ({
                                ...record,
                                organizationId,
                            }));
                        }
                    }
                    if (operation === 'upsert') {
                        op.where = mergeWhere(op.where, { organizationId });
                        if (op.create) {
                            op.create = {
                                ...op.create,
                                organizationId,
                            };
                        }
                    }
                    return query(op);
                },
            },
        },
    });
}
exports.createTenantMiddleware = createTenantExtension;
//# sourceMappingURL=tenant.middleware.js.map