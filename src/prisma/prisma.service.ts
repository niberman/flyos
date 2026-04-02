import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { getRequestOrganizationId } from './tenant.context';
import { createTenantExtension } from './tenant.middleware';

/**
 * All Prisma model delegate names that should be routed through the
 * tenant-scoped extended client once the extension is applied.
 */
const MODEL_DELEGATES = [
  'user',
  'aircraft',
  'booking',
  'base',
  'organization',
  'maintenanceLog',
  'telemetry',
  'userBase',
] as const;

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
    // Apply the tenant isolation extension using Prisma 7's $extends API.
    // The extension reads the current organizationId from AsyncLocalStorage
    // and injects WHERE filters on reads and organizationId on creates.
    //
    // $extends returns a NEW client wrapper — we patch model delegate
    // properties on `this` so existing service code like
    // `this.prisma.user.findMany()` transparently routes through the
    // tenant-scoped client.
    if (typeof this.$extends === 'function') {
      const extension = createTenantExtension(getRequestOrganizationId);
      const extended = this.$extends(extension) as Record<string, unknown>;

      for (const name of MODEL_DELEGATES) {
        Object.defineProperty(this, name, {
          get: () => extended[name],
          configurable: true,
        });
      }

      // Route $transaction through the extended client so queries inside
      // transactions also get tenant filtering.
      const boundTransaction = (extended.$transaction as Function).bind(
        extended,
      );
      Object.defineProperty(this, '$transaction', {
        value: boundTransaction,
        writable: true,
        configurable: true,
      });
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
