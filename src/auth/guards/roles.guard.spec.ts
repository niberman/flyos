// ==========================================================================
// RolesGuard — Unit Tests
// ==========================================================================
// Tests the RBAC guard that checks the authenticated user's role against
// the roles required by the @Roles() decorator on the resolver method.
// ==========================================================================

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

/**
 * Helper to build a mock ExecutionContext that returns the given user
 * from the GraphQL context's request object.
 */
function mockContext(user?: { role: string }): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getArgs: () => [{}, {}, { req: { user } }, {}],
    getType: () => 'graphql',
    switchToHttp: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getArgByIndex: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no @Roles() decorator is present', () => {
    // When no roles are required, getAllAndOverride returns undefined.
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(mockContext({ role: Role.STUDENT }))).toBe(true);
  });

  it('allows access when @Roles() decorator has an empty array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

    expect(guard.canActivate(mockContext({ role: Role.STUDENT }))).toBe(true);
  });

  it('allows access when user role matches one of the required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.INSTRUCTOR, Role.DISPATCHER]);

    expect(guard.canActivate(mockContext({ role: Role.DISPATCHER }))).toBe(
      true,
    );
  });

  it('denies access when user role does not match any required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.DISPATCHER]);

    expect(guard.canActivate(mockContext({ role: Role.STUDENT }))).toBe(false);
  });

  it('denies access when user object has no role property', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.DISPATCHER]);

    expect(guard.canActivate(mockContext({} as any))).toBe(false);
  });

  it('denies access when user is undefined (unauthenticated)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.DISPATCHER]);

    expect(guard.canActivate(mockContext(undefined))).toBe(false);
  });

  it('checks all three role values correctly', () => {
    const roles = [Role.STUDENT, Role.INSTRUCTOR, Role.DISPATCHER];
    for (const requiredRole of roles) {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([requiredRole]);

      // Matching role should pass
      expect(guard.canActivate(mockContext({ role: requiredRole }))).toBe(true);

      // Non-matching roles should fail
      for (const otherRole of roles.filter((r) => r !== requiredRole)) {
        expect(guard.canActivate(mockContext({ role: otherRole }))).toBe(false);
      }
    }
  });
});
