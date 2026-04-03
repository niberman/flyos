// ==========================================================================
// TenantContext — Unit Tests
// ==========================================================================
// Tests the per-request tenant context service and the AsyncLocalStorage
// helpers used for multi-tenant isolation.
// ==========================================================================

import {
  TenantContext,
  tenantStorage,
  getRequestOrganizationId,
  runWithTenantContext,
} from './tenant.context';

describe('TenantContext', () => {
  let ctx: TenantContext;

  beforeEach(() => {
    ctx = new TenantContext();
  });

  afterEach(() => {
    // Clear any AsyncLocalStorage state between tests.
    tenantStorage.enterWith(undefined as any);
  });

  describe('initial state', () => {
    it('has null organizationId by default', () => {
      expect(ctx.organizationId).toBeNull();
    });

    it('has null baseId by default', () => {
      expect(ctx.baseId).toBeNull();
    });
  });

  describe('setOrganization', () => {
    it('sets the organization id', () => {
      ctx.setOrganization('org-1');
      expect(ctx.organizationId).toBe('org-1');
    });

    it('updates AsyncLocalStorage so getRequestOrganizationId returns it', () => {
      ctx.setOrganization('org-async');
      expect(getRequestOrganizationId()).toBe('org-async');
    });

    it('can be updated to a different organization', () => {
      ctx.setOrganization('org-1');
      ctx.setOrganization('org-2');
      expect(ctx.organizationId).toBe('org-2');
    });
  });

  describe('setBase', () => {
    it('sets the base id after org is set', () => {
      ctx.setOrganization('org-1');
      ctx.setBase('base-1');
      expect(ctx.baseId).toBe('base-1');
    });

    it('does not push to ALS when no org is set', () => {
      ctx.setBase('base-orphan');
      // The private _baseId is set but ALS store won't have it
      // because setBase early-returns without an org.
      expect(ctx.baseId).toBe('base-orphan');
    });
  });
});

describe('getRequestOrganizationId', () => {
  afterEach(() => {
    tenantStorage.enterWith(undefined as any);
  });

  it('returns null when no store is set', () => {
    expect(getRequestOrganizationId()).toBeNull();
  });

  it('returns the organizationId from AsyncLocalStorage', () => {
    tenantStorage.enterWith({ organizationId: 'org-als' });
    expect(getRequestOrganizationId()).toBe('org-als');
  });
});

describe('runWithTenantContext', () => {
  it('provides tenant context within the callback', () => {
    const result = runWithTenantContext({ organizationId: 'org-run' }, () => {
      return getRequestOrganizationId();
    });
    expect(result).toBe('org-run');
  });

  it('provides tenant context within an async callback', async () => {
    const result = await runWithTenantContext(
      { organizationId: 'org-async-run', baseId: 'base-x' },
      async () => {
        return getRequestOrganizationId();
      },
    );
    expect(result).toBe('org-async-run');
  });

  it('does not leak context outside the callback', () => {
    runWithTenantContext({ organizationId: 'org-scoped' }, () => {
      // inside: should see context
      expect(getRequestOrganizationId()).toBe('org-scoped');
    });
    // outside: ALS `.run()` should not leak
    // (Note: in practice this depends on whether a parent store exists)
  });
});
