import { AsyncLocalStorage } from 'async_hooks';
export interface TenantStore {
    organizationId: string;
    baseId?: string;
}
export declare const tenantStorage: AsyncLocalStorage<TenantStore>;
export declare function getRequestOrganizationId(): string | null;
export declare function runWithTenantContext<T>(store: TenantStore, fn: () => T | Promise<T>): T | Promise<T>;
export declare class TenantContext {
    private _organizationId;
    private _baseId;
    get organizationId(): string | null;
    get baseId(): string | null;
    setOrganization(organizationId: string): void;
    setBase(baseId: string): void;
}
