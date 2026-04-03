// ==========================================================================
// Tenant Extension — Prisma Query Rewriting for Multi-Tenant Isolation
// ==========================================================================
// This file implements the actual query-shaping rules that keep one
// organization from seeing or mutating another organization's data.
//
// Model categories:
//   - Directly scoped models carry `organizationId` on the row itself.
//   - Base-scoped models inherit tenancy through their related Base row.
//   - Organization is intentionally excluded because it is the tenant root.
//
// The extension is conservative: it augments read/update/delete filters and
// injects organizationId on creates where the model owns that column, while
// leaving special auth lookups like `User.findUnique({ email })` untouched.
// ==========================================================================

import { Prisma } from '@prisma/client';

/**
 * Models with a direct `organizationId` column. Organization is excluded — it is
 * the root tenant entity.
 */
const DIRECTLY_SCOPED_MODELS: ReadonlySet<string> = new Set([
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

/** Models scoped to a tenant only through a related Base row. */
const BASE_SCOPED_MODELS: ReadonlySet<string> = new Set([
  'Booking',
  'UserBase',
]);

/**
 * Query operations where a tenant filter should be injected into `where`.
 */
const FILTERED_ACTIONS: ReadonlySet<string> = new Set([
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

function mergeWhere(
  existing: Record<string, unknown> | undefined,
  tenantClause: Record<string, unknown>,
): Record<string, unknown> {
  if (!existing || Object.keys(existing).length === 0) {
    return tenantClause;
  }
  // Keep the caller's original predicate intact and layer tenant scoping on
  // top of it. AND avoids accidentally overwriting user-supplied filters.
  return { AND: [existing, tenantClause] };
}

/**
 * Prisma 7 tenant isolation via Client Extensions (the supported replacement
 * for deprecated `$use` middleware). Intercepts queries and enforces
 * organization scoping.
 *
 * - Skips the Organization model.
 * - Skips User `findUnique` / `findUniqueOrThrow` / `upsert` `where` (auth
 *   login by email and Prisma `WhereUniqueInput` rules).
 */
export function createTenantExtension(getOrganizationId: () => string | null) {
  return Prisma.defineExtension({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const organizationId = getOrganizationId();

          if (!organizationId) {
            return query(args);
          }

          // Prisma operation args are a wide union; mutate via a loose handle.
          const op = args as Record<string, unknown>;

          if (model === 'Organization') {
            return query(args);
          }

          // User: never merge organizationId into unique-input `where` clauses.
          if (model === 'User') {
            if (
              operation === 'findUnique' ||
              operation === 'findUniqueOrThrow'
            ) {
              return query(args);
            }
            if (operation === 'upsert') {
              const nextArgs = { ...op };
              if (nextArgs.create) {
                nextArgs.create = {
                  ...(nextArgs.create as Record<string, unknown>),
                  organizationId,
                };
              }
              return query(nextArgs);
            }
          }

          if (BASE_SCOPED_MODELS.has(model)) {
            if (FILTERED_ACTIONS.has(operation)) {
              // Bookings and UserBase rows do not have organizationId, so
              // tenant isolation must flow through their related base.
              const tenantClause = { base: { organizationId } };
              op.where = mergeWhere(
                op.where as Record<string, unknown> | undefined,
                tenantClause,
              );
            }
            return query(op);
          }

          if (!DIRECTLY_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          if (FILTERED_ACTIONS.has(operation)) {
            op.where = mergeWhere(
              op.where as Record<string, unknown> | undefined,
              { organizationId },
            );
          }

          if (operation === 'create') {
            // Directly-scoped models should never rely on callers to remember
            // organizationId; the extension writes it centrally.
            op.data = {
              ...(op.data as Record<string, unknown>),
              organizationId,
            };
          }

          if (operation === 'createMany') {
            const data = op.data;
            if (Array.isArray(data)) {
              // Apply the same guarantee across batch inserts so every row is
              // tagged with the active tenant before Prisma executes SQL.
              op.data = data.map((record: Record<string, unknown>) => ({
                ...record,
                organizationId,
              }));
            }
          }

          if (operation === 'upsert') {
            op.where = mergeWhere(
              op.where as Record<string, unknown> | undefined,
              { organizationId },
            );
            if (op.create) {
              op.create = {
                ...(op.create as Record<string, unknown>),
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

/** Alias for callers that think in terms of “tenant middleware”. */
export const createTenantMiddleware = createTenantExtension;
