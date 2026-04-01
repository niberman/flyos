// ==========================================================================
// DevUserSeedService — Ensures a real user exists for dev auth impersonation
// ==========================================================================
// When dev auth bypass is enabled and the users table is empty, creates one
// DISPATCHER user so JwtAuthGuard can resolve req.user and FKs stay valid.
// ==========================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isDevAuthBypassEnabled } from './dev-auth.config';

@Injectable()
export class DevUserSeedService implements OnModuleInit {
  private readonly logger = new Logger(DevUserSeedService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isDevAuthBypassEnabled(this.config)) {
      return;
    }

    const count = await this.prisma.user.count();
    if (count > 0) {
      return;
    }

    const email =
      this.config.get<string>('FLYOS_DEV_SEED_EMAIL')?.trim() ||
      'dev@flyos.local';
    const password =
      this.config.get<string>('FLYOS_DEV_SEED_PASSWORD')?.trim() || 'flyosdev';

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          role: Role.DISPATCHER,
        },
      });
      this.logger.log(
        `Seeded dev user ${email} (login password: env FLYOS_DEV_SEED_PASSWORD or default "flyosdev").`,
      );
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
      if (code === 'P2002') {
        return;
      }
      throw err;
    }
  }
}
