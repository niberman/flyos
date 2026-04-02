// ==========================================================================
// Tenant Context — Request-Scoped Organization/Base Identity
// ==========================================================================
// FlyOS enforces multi-tenant isolation in two cooperating layers:
//
//   1. AsyncLocalStorage keeps the active organization/base available across
//      async boundaries so the Prisma extension can read it during queries.
//   2. TenantContext gives request-scoped Nest providers a convenient place to
//      set and read the same values inside guards, resolvers, and services.
//
// The service intentionally falls back between AsyncLocalStorage and private
// fields because some code paths set tenant data before ALS exists, while
// others run fully inside an established async context.
// ==========================================================================

import { AsyncLocalStorage } from 'async_hooks';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Per-request tenant identifiers. Stored in AsyncLocalStorage so a singleton
 * PrismaClient extension can read the active org during query execution.
 */
export interface TenantStore {
  organizationId: string;
  baseId?: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

/**
 * Returns the organization id for the current async context, if any.
 */
export function getRequestOrganizationId(): string | null {
  return tenantStorage.getStore()?.organizationId ?? null;
}

/**
 * Runs `fn` with tenant context set for the current async continuation chain.
 * Prefer this from HTTP middleware/interceptors so all nested awaits see the
 * same store without relying on `enterWith`.
 */
export function runWithTenantContext<T>(
  store: TenantStore,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return tenantStorage.run(store, fn);
}

@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  private _organizationId: string | null = null;
  private _baseId: string | null = null;

  get organizationId(): string | null {
    // Prefer the async context when present so nested awaits keep using the
    // request-scoped organization even if this instance was constructed earlier.
    return (
      tenantStorage.getStore()?.organizationId ?? this._organizationId
    );
  }

  get baseId(): string | null {
    // Base follows the same lookup rules as organizationId. This allows base
    // filters to remain request-local while still supporting unit tests that
    // instantiate TenantContext directly without AsyncLocalStorage.
    return tenantStorage.getStore()?.baseId ?? this._baseId;
  }

  setOrganization(organizationId: string): void {
    this._organizationId = organizationId;
    const prev = tenantStorage.getStore();
    // Preserve any previously-known base when the organization is rebound so
    // downstream code can continue to use both values in the same request.
    tenantStorage.enterWith({
      organizationId,
      baseId: prev?.baseId ?? this._baseId ?? undefined,
    });
  }

  setBase(baseId: string): void {
    this._baseId = baseId;
    const org =
      tenantStorage.getStore()?.organizationId ?? this._organizationId;
    if (!org) {
      // Without an organization there is nothing meaningful to publish to the
      // async context yet, so keep only the local fallback field updated.
      return;
    }
    tenantStorage.enterWith({
      organizationId: org,
      baseId,
    });
  }
}
