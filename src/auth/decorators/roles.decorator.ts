// ==========================================================================
// @Roles() Decorator — Role Metadata Setter
// ==========================================================================
// This custom decorator attaches role metadata to a resolver method or class.
// The RolesGuard reads this metadata at runtime to enforce RBAC.
//
// Usage:
//   @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
//   @Mutation(() => Booking)
//   async createBooking(...) { ... }
//
// How it works:
//   SetMetadata stores key-value pairs in the NestJS reflection system.
//   The RolesGuard uses the Reflector service to read ROLES_KEY and
//   determine which roles are permitted for the decorated handler.
// ==========================================================================

import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator that specifies which roles are allowed to access a resolver.
 * @param roles - One or more Role enum values.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
