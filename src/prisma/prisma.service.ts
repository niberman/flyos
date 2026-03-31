// ==========================================================================
// PrismaService — Database Access Layer
// ==========================================================================
// This service wraps the Prisma Client and integrates it into the NestJS
// dependency injection system. In the MVC architecture:
//
//   Model Layer: PrismaService IS the Model. It provides typed methods for
//   every database table (User, Aircraft, Booking, etc.) and handles the
//   connection lifecycle. All services (Controllers in MVC terms) inject
//   this service to perform CRUD operations.
//
// Data Flow:
//   GraphQL Resolver (Controller) → Service (Business Logic) → PrismaService
//   (Model) → PostgreSQL Database
//
// By centralizing database access in a single injectable service, we ensure:
//   - A single database connection pool shared across the application.
//   - Consistent lifecycle management (connect on init, disconnect on destroy).
//   - Easy mocking in unit tests by replacing this single provider.
// ==========================================================================

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService extends the auto-generated PrismaClient and hooks into
 * NestJS module lifecycle events to manage the database connection.
 *
 * Implements OnModuleInit to connect when the module initializes, and
 * OnModuleDestroy to cleanly disconnect when the application shuts down.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Called automatically by NestJS after the module is initialized.
   * Establishes the connection to PostgreSQL via the DATABASE_URL
   * environment variable configured in prisma.config.ts.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Called automatically by NestJS when the application is shutting down.
   * Gracefully closes the database connection pool to prevent connection leaks.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
