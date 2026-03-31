// ==========================================================================
// RolesGuard — Role-Based Access Control (RBAC) Guard
// ==========================================================================
// This guard enforces role-based access control by checking the authenticated
// user's role against the roles required by the @Roles() decorator.
//
// How it works in the MVC data flow:
//   1. The @Roles(Role.INSTRUCTOR, Role.DISPATCHER) decorator sets metadata
//      on the resolver method specifying which roles are permitted.
//   2. JwtAuthGuard runs first, verifying the token and populating req.user.
//   3. RolesGuard runs next, reading the required roles from metadata and
//      comparing them against req.user.role.
//   4. If the user's role matches, the request proceeds to the resolver.
//   5. If not, a 403 Forbidden response is returned.
//
// This implements the Authorization layer of the Controller in the MVC
// pattern — it determines WHO can execute which operations.
//
// Usage (applied together with JwtAuthGuard):
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(Role.DISPATCHER)
//   @Mutation(() => Aircraft)
//   async createAircraft(...) { ... }
// ==========================================================================

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * canActivate is the core method of any NestJS guard. It returns true
   * if the request should proceed, or false to deny access.
   *
   * @param context - The execution context providing access to the handler
   *                  and its metadata (including @Roles() decorator values).
   * @returns true if the user's role is in the list of required roles.
   */
  canActivate(context: ExecutionContext): boolean {
    // Read the required roles from the @Roles() decorator metadata.
    // If no @Roles() decorator is present, allow access (no restriction).
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Extract the user from the GraphQL context (populated by JwtAuthGuard).
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;

    // Check if the authenticated user's role is in the list of permitted roles.
    return requiredRoles.includes(user.role);
  }
}
