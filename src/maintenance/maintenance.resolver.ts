// ==========================================================================
// MaintenanceResolver — GraphQL queries for predictive maintenance
// ==========================================================================

import { Resolver, Query, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { Alert } from './alert.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Resolver()
export class MaintenanceResolver {
  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Query(() => [Alert], {
    description:
      'Telemetry threshold violations for the current organization. Defaults to the last 24 hours.',
  })
  async alertHistory(
    @CurrentUser() user: { userId: string },
    @Args('aircraftId', { type: () => ID, nullable: true }) aircraftId?: string,
    @Args('hours', { type: () => Int, nullable: true, defaultValue: 24 })
    hours?: number,
  ): Promise<Alert[]> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { organizationId: true },
    });
    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }
    return this.maintenanceService.getAlertHistory(
      dbUser.organizationId,
      aircraftId,
      hours ?? 24,
    );
  }
}
