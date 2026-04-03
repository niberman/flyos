// ==========================================================================
// createTenantExtension — Unit Tests
// ==========================================================================
// Tests the Prisma Client Extension that injects organizationId filters
// into queries for multi-tenant isolation. We mock Prisma.defineExtension
// to passthrough the raw config object so we can test the handler directly.
// ==========================================================================

import { Prisma } from '@prisma/client';
import {
  createTenantExtension,
  createTenantMiddleware,
} from './tenant.middleware';

// Capture the config object passed to Prisma.defineExtension.
let capturedConfig: any;
jest.spyOn(Prisma, 'defineExtension').mockImplementation((config: any) => {
  capturedConfig = config;
  return config;
});

/**
 * Calls the $allOperations handler from the captured extension config
 * with the given model, operation, and args, using a passthrough query fn.
 */
async function callHandler(
  getOrgId: () => string | null,
  model: string,
  operation: string,
  args: Record<string, any> = {},
): Promise<{ result: any; calledWith: any }> {
  // Recreate the extension to capture the config with this specific getOrgId
  createTenantExtension(getOrgId);
  const handler = capturedConfig.query.$allModels.$allOperations;

  const queryFn = jest.fn(async (a: any) => a);
  const result = await handler({
    model,
    operation,
    args: { ...args },
    query: queryFn,
  });
  return { result, calledWith: queryFn.mock.calls[0]?.[0] ?? args };
}

describe('createTenantExtension', () => {
  const getOrgId = () => 'org-tenant';

  // ---- No tenant context ----

  describe('when no organization context is set', () => {
    const noOrg = () => null;

    it('passes queries through unmodified', async () => {
      const { calledWith } = await callHandler(noOrg, 'User', 'findMany', {
        where: { email: 'a@b.com' },
      });
      expect(calledWith.where).toEqual({ email: 'a@b.com' });
    });
  });

  // ---- Organization model (always skipped) ----

  describe('Organization model', () => {
    it('is never scoped by tenant', async () => {
      const { calledWith } = await callHandler(
        getOrgId,
        'Organization',
        'findMany',
        { where: {} },
      );
      expect(calledWith.where).toEqual({});
    });
  });

  // ---- Directly-scoped models ----

  describe('directly-scoped models (e.g., Aircraft)', () => {
    it('injects organizationId into findMany where clause', async () => {
      const { calledWith } = await callHandler(
        getOrgId,
        'Aircraft',
        'findMany',
        { where: { make: 'Cessna' } },
      );
      expect(calledWith.where).toEqual({
        AND: [{ make: 'Cessna' }, { organizationId: 'org-tenant' }],
      });
    });

    it('injects organizationId into findFirst where clause', async () => {
      const { calledWith } = await callHandler(getOrgId, 'Base', 'findFirst', {
        where: { icaoCode: 'KAPA' },
      });
      expect(calledWith.where).toEqual({
        AND: [{ icaoCode: 'KAPA' }, { organizationId: 'org-tenant' }],
      });
    });

    it('sets organizationId on empty where clause', async () => {
      const { calledWith } = await callHandler(
        getOrgId,
        'Aircraft',
        'findMany',
        { where: {} },
      );
      expect(calledWith.where).toEqual({ organizationId: 'org-tenant' });
    });

    it('injects organizationId on create', async () => {
      const { calledWith } = await callHandler(getOrgId, 'Aircraft', 'create', {
        data: { tailNumber: 'N999' },
      });
      expect(calledWith.data).toEqual({
        tailNumber: 'N999',
        organizationId: 'org-tenant',
      });
    });

    it('injects organizationId on createMany', async () => {
      const { calledWith } = await callHandler(
        getOrgId,
        'Telemetry',
        'createMany',
        { data: [{ aircraftId: 'ac-1' }, { aircraftId: 'ac-2' }] },
      );
      expect(calledWith.data).toEqual([
        { aircraftId: 'ac-1', organizationId: 'org-tenant' },
        { aircraftId: 'ac-2', organizationId: 'org-tenant' },
      ]);
    });

    it('injects organizationId on upsert where and create', async () => {
      const { calledWith } = await callHandler(getOrgId, 'Aircraft', 'upsert', {
        where: { id: 'ac-1' },
        create: { tailNumber: 'N111' },
        update: { make: 'Piper' },
      });
      expect(calledWith.where).toEqual({
        AND: [{ id: 'ac-1' }, { organizationId: 'org-tenant' }],
      });
      expect(calledWith.create).toEqual({
        tailNumber: 'N111',
        organizationId: 'org-tenant',
      });
    });

    it('injects filter on update operations', async () => {
      const { calledWith } = await callHandler(getOrgId, 'Aircraft', 'update', {
        where: { id: 'ac-1' },
        data: { make: 'Piper' },
      });
      expect(calledWith.where).toEqual({
        AND: [{ id: 'ac-1' }, { organizationId: 'org-tenant' }],
      });
    });

    it('injects filter on delete operations', async () => {
      const { calledWith } = await callHandler(getOrgId, 'Aircraft', 'delete', {
        where: { id: 'ac-1' },
      });
      expect(calledWith.where).toEqual({
        AND: [{ id: 'ac-1' }, { organizationId: 'org-tenant' }],
      });
    });

    it('injects filter on count operations', async () => {
      const { calledWith } = await callHandler(getOrgId, 'Aircraft', 'count', {
        where: {},
      });
      expect(calledWith.where).toEqual({ organizationId: 'org-tenant' });
    });
  });

  // ---- User model (special handling for unique lookups) ----

  describe('User model', () => {
    it('does NOT modify findUnique where clause (used for auth)', async () => {
      const { calledWith } = await callHandler(getOrgId, 'User', 'findUnique', {
        where: { email: 'test@example.com' },
      });
      expect(calledWith.where).toEqual({ email: 'test@example.com' });
    });

    it('does NOT modify findUniqueOrThrow where clause', async () => {
      const { calledWith } = await callHandler(
        getOrgId,
        'User',
        'findUniqueOrThrow',
        { where: { id: 'user-1' } },
      );
      expect(calledWith.where).toEqual({ id: 'user-1' });
    });

    it('injects organizationId on User upsert create', async () => {
      const { calledWith } = await callHandler(getOrgId, 'User', 'upsert', {
        where: { email: 'x@y.com' },
        create: { email: 'x@y.com' },
        update: {},
      });
      expect(calledWith.create).toEqual({
        email: 'x@y.com',
        organizationId: 'org-tenant',
      });
    });

    it('injects filter on User findMany', async () => {
      const { calledWith } = await callHandler(getOrgId, 'User', 'findMany', {
        where: {},
      });
      expect(calledWith.where).toEqual({ organizationId: 'org-tenant' });
    });
  });

  // ---- Base-scoped models (Booking, UserBase) ----

  describe('base-scoped models (e.g., Booking)', () => {
    it('injects base.organizationId filter on findMany', async () => {
      const { calledWith } = await callHandler(
        getOrgId,
        'Booking',
        'findMany',
        { where: { userId: 'user-1' } },
      );
      expect(calledWith.where).toEqual({
        AND: [{ userId: 'user-1' }, { base: { organizationId: 'org-tenant' } }],
      });
    });

    it('injects base.organizationId filter on UserBase findMany', async () => {
      const { calledWith } = await callHandler(
        getOrgId,
        'UserBase',
        'findMany',
        { where: {} },
      );
      expect(calledWith.where).toEqual({
        base: { organizationId: 'org-tenant' },
      });
    });

    it('does NOT inject organizationId into create data for Booking', async () => {
      const { calledWith } = await callHandler(getOrgId, 'Booking', 'create', {
        data: { userId: 'u1', aircraftId: 'a1' },
      });
      expect(calledWith.data).toEqual({ userId: 'u1', aircraftId: 'a1' });
    });
  });
});

describe('createTenantMiddleware alias', () => {
  it('is the same function as createTenantExtension', () => {
    expect(createTenantMiddleware).toBe(createTenantExtension);
  });
});
