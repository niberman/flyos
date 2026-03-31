// ==========================================================================
// UsersResolver — GraphQL Controller for User Queries
// ==========================================================================
// This resolver acts as the **Controller** in the MVC pattern for user
// operations. It:
//   1. Defines the GraphQL queries available for users.
//   2. Applies authentication guards to protect sensitive data.
//   3. Delegates all data retrieval to UsersService (business logic).
//
// Data Flow:
//   Client Query → GraphQL Engine → UsersResolver (Controller) →
//   UsersService → PrismaService (Model) → PostgreSQL →
//   UserType (View) returned to client.
//
// Access Control:
//   - "me" query: Any authenticated user can retrieve their own profile.
//   - "users" query: Only INSTRUCTOR and DISPATCHER roles can list all users.
// ==========================================================================

import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserType } from './user.type';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Query: me
   * Returns the profile of the currently authenticated user.
   * Requires a valid JWT token but does not enforce any specific role.
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => UserType, {
    description: 'Get the profile of the currently authenticated user.',
  })
  async me(
    @CurrentUser() user: { userId: string; role: string },
  ): Promise<UserType> {
    return this.usersService.findById(user.userId);
  }

  /**
   * Query: users
   * Returns a list of all users in the system.
   * Restricted to INSTRUCTOR and DISPATCHER roles via RBAC guards.
   *
   * Guard execution order:
   *   1. JwtAuthGuard verifies the token and populates req.user.
   *   2. RolesGuard checks req.user.role against @Roles() metadata.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Query(() => [UserType], {
    description: 'List all users. Restricted to INSTRUCTOR and DISPATCHER.',
  })
  async users(): Promise<UserType[]> {
    return this.usersService.findAll();
  }
}
