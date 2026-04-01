// ==========================================================================
// JwtAuthGuard — Authentication Guard
// ==========================================================================
// See dev-auth.config.ts for bypass rules. Invalid JWT in dev falls back to
// impersonation. User comes from DB: FLYOS_DEV_USER_ID, or first user, or
// DevUserSeedService-created dev@flyos.local when the DB was empty at boot.
// ==========================================================================

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { isDevAuthBypassEnabled } from '../dev-auth.config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!isDevAuthBypassEnabled(this.config)) {
      return (await super.canActivate(context)) as boolean;
    }

    const req = this.getRequest(context);
    const authHeader = req.headers?.authorization;
    const hasBearer =
      typeof authHeader === 'string' && /^Bearer\s+\S+/i.test(authHeader);

    if (hasBearer) {
      try {
        const ok = (await super.canActivate(context)) as boolean;
        if (ok) {
          return true;
        }
      } catch {
        // Invalid or expired JWT in dev — fall through to impersonation.
      }
    }

    req.user = await this.resolveDevUser();
    return true;
  }

  private parseDevRole(raw: string | undefined): Role {
    if (!raw?.trim()) {
      return Role.DISPATCHER;
    }
    const upper = raw.trim().toUpperCase() as Role;
    if (Object.values(Role).includes(upper)) {
      return upper;
    }
    return Role.DISPATCHER;
  }

  private async resolveDevUser(): Promise<{ userId: string; role: string }> {
    const configuredId = this.config.get<string>('FLYOS_DEV_USER_ID')?.trim();
    if (configuredId) {
      const user = await this.prisma.user.findUnique({
        where: { id: configuredId },
      });
      if (!user) {
        throw new UnauthorizedException(
          `FLYOS_DEV_USER_ID="${configuredId}" does not match any user.`,
        );
      }
      const roleEnv = this.config.get<string>('FLYOS_DEV_USER_ROLE');
      return {
        userId: user.id,
        role: this.parseDevRole(roleEnv),
      };
    }

    const first = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (!first) {
      throw new UnauthorizedException(
        'No users in the database yet. Restart the server so the dev user seed can run, or run register.',
      );
    }
    return { userId: first.id, role: first.role };
  }
}
