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
export function createTenantExtension(
  getOrganizationId: () => string | null,
) {
  return Prisma.defineExtension({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const organizationId = getOrganizationId();

          if (!organizationId) {
            return query(args);
          }

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
              const nextArgs = { ...args };
              if (nextArgs.create) {
                nextArgs.create = {
                  ...nextArgs.create,
                  organizationId,
                };
              }
              return query(nextArgs);
            }
          }

          if (BASE_SCOPED_MODELS.has(model!)) {
            if (FILTERED_ACTIONS.has(operation)) {
              const tenantClause = { base: { organizationId } };
              args.where = mergeWhere(
                args.where as Record<string, unknown> | undefined,
                tenantClause,
              );
            }
            return query(args);
          }

          if (!DIRECTLY_SCOPED_MODELS.has(model!)) {
            return query(args);
          }

          if (FILTERED_ACTIONS.has(operation)) {
            args.where = mergeWhere(
              args.where as Record<string, unknown> | undefined,
              { organizationId },
            );
          }

          if (operation === 'create') {
            args.data = { ...args.data, organizationId };
          }

          if (operation === 'createMany') {
            const data = args.data;
            if (Array.isArray(data)) {
              args.data = data.map((record: Record<string, unknown>) => ({
                ...record,
                organizationId,
              }));
            }
          }

          if (operation === 'upsert') {
            args.where = mergeWhere(
              args.where as Record<string, unknown> | undefined,
              { organizationId },
            );
            if (args.create) {
              args.create = { ...args.create, organizationId };
            }
          }

          return query(args);
        },
      },
    },
  });
}

/** Alias for callers that think in terms of “tenant middleware”. */
export const createTenantMiddleware = createTenantExtension;
