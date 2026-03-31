// ==========================================================================
// PrismaModule — Global Database Module
// ==========================================================================
// This module is marked as @Global() so that PrismaService is available
// for injection in every module without needing to import PrismaModule
// explicitly. This follows the NestJS convention for cross-cutting
// infrastructure concerns like database access.
// ==========================================================================

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
