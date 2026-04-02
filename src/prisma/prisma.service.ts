// ==========================================================================
// PrismaService — Prisma Client Bootstrap + Tenant-Aware Delegate Wiring
// ==========================================================================
// This service owns the application's database client lifecycle.
//
// Why this file matters:
//   1. It validates that DATABASE_URL exists before Nest finishes booting.
//   2. It builds the Prisma 7 client using the pg driver adapter.
//   3. It applies the tenant extension once, then re-exposes the extended
//      model delegates on `this` so the rest of the codebase can keep using
//      `this.prisma.user`, `this.prisma.aircraft`, etc. without knowing an
//      extension wrapper exists underneath.
//
// The important subtlety is that `$extends()` returns a new client wrapper.
// Existing services are injected with the original PrismaService instance, so
// this file patches the delegate getters after boot. That keeps the public API
// stable while still enforcing tenant isolation centrally.
// ==========================================================================

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
    // Read and validate the connection string before constructing Prisma.
    // Failing fast here gives a direct boot-time error instead of a later,
    // harder-to-diagnose runtime failure on first query.
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
        // Define lazy getters so every access resolves against the extended
        // client wrapper rather than copying delegates once and risking drift.
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
    // Mirror Nest's module lifecycle so Jest and application shutdown both
    // release connections deterministically.
    await this.$disconnect();
  }
}
