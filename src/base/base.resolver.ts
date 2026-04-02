import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { BaseType } from './base.type';
import { BaseService } from './base.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';

@Resolver(() => BaseType)
export class BaseResolver {
  constructor(
    private readonly baseService: BaseService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private async bindTenantContext(user: { userId: string }): Promise<void> {
    const row = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { organizationId: true },
    });
    if (!row) {
      throw new UnauthorizedException();
    }
    this.tenantContext.setOrganization(row.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [BaseType], { description: 'List all bases in the organization.' })
  async bases(
    @CurrentUser() user: { userId: string; role: string },
  ): Promise<BaseType[]> {
    await this.bindTenantContext(user);
    return this.baseService.findAll();
  }
}
