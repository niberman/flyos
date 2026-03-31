// ==========================================================================
// UsersService — Business Logic for User Operations
// ==========================================================================
// In the MVC pattern, this service is the intermediary between the
// Controller (UsersResolver) and the Model (PrismaService).
//
// Data Flow:
//   UsersResolver receives a GraphQL query → delegates to UsersService →
//   UsersService calls PrismaService (Model) → Prisma queries PostgreSQL →
//   Result flows back through the chain as a UserType (View).
// ==========================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all users from the database.
   * Used by INSTRUCTOR and DISPATCHER roles for user management.
   */
  async findAll() {
    return this.prisma.user.findMany();
  }

  /**
   * Retrieves a single user by their UUID.
   * @throws NotFoundException if no user exists with the given ID.
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    return user;
  }
}
