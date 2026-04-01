// ==========================================================================
// PrismaService — Database Access Layer
// ==========================================================================
// Prisma 7 requires the client to be constructed with either a driver adapter
// (here: @prisma/adapter-pg + DATABASE_URL) or an Accelerate URL — the URL
// alone in prisma.config.ts is for migrations, not runtime client construction.
// ==========================================================================

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly config: ConfigService) {
    const databaseUrl = config.get<string>('DATABASE_URL')?.trim();
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is missing or empty. Set it in your environment (e.g. .env).',
      );
    }
    const adapter = new PrismaPg(databaseUrl);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
