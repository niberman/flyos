// ==========================================================================
// IngestionResolver — GraphQL Controller for Data Ingestion
// ==========================================================================

import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { MaintenanceLogType } from './maintenance-log.type';
import { TelemetryType } from './telemetry.type';
import { BatchMaintenanceInput } from './dto/batch-maintenance.input';
import { BatchTelemetryInput } from './dto/batch-telemetry.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Resolver()
export class IngestionResolver {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly prisma: PrismaService,
  ) {}

  private async organizationIdForUser(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user.organizationId;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Mutation(() => [MaintenanceLogType], {
    description:
      'Batch upload maintenance log records. INSTRUCTOR and DISPATCHER only. Scoped to your organization.',
  })
  async ingestMaintenanceLogs(
    @CurrentUser() user: { userId: string; role: string },
    @Args('input') input: BatchMaintenanceInput,
  ): Promise<MaintenanceLogType[]> {
    const organizationId = await this.organizationIdForUser(user.userId);
    return this.ingestionService.ingestMaintenanceLogs(input, organizationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Mutation(() => [TelemetryType], {
    description:
      'Batch upload telemetry sensor data. INSTRUCTOR and DISPATCHER only. Scoped to your organization.',
  })
  async ingestTelemetry(
    @CurrentUser() user: { userId: string; role: string },
    @Args('input') input: BatchTelemetryInput,
  ): Promise<TelemetryType[]> {
    const organizationId = await this.organizationIdForUser(user.userId);
    return this.ingestionService.ingestTelemetry(input, organizationId);
  }
}
