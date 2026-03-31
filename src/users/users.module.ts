// ==========================================================================
// UsersModule — Feature Module for User Management
// ==========================================================================
// Encapsulates all user-related providers (service, resolver) into a
// cohesive NestJS module. PrismaService is available globally and does
// not need to be imported here.
// ==========================================================================

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';

@Module({
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
