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
    return (
      tenantStorage.getStore()?.organizationId ?? this._organizationId
    );
  }

  get baseId(): string | null {
    return tenantStorage.getStore()?.baseId ?? this._baseId;
  }

  setOrganization(organizationId: string): void {
    this._organizationId = organizationId;
    const prev = tenantStorage.getStore();
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
      return;
    }
    tenantStorage.enterWith({
      organizationId: org,
      baseId,
    });
  }
}
