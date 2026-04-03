import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { BaseType } from './base.type';
import { BaseService } from './base.service';
import { CreateBaseInput } from './dto/create-base.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
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
  @Query(() => [BaseType], {
    description: 'List all bases in the organization.',
  })
  async bases(
    @CurrentUser() user: { userId: string; role: string },
  ): Promise<BaseType[]> {
    await this.bindTenantContext(user);
    return this.baseService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISPATCHER)
  @Mutation(() => BaseType, {
    description: 'Create a new base. DISPATCHER only.',
  })
  async createBase(
    @CurrentUser() user: { userId: string; role: string },
    @Args('input') input: CreateBaseInput,
  ): Promise<BaseType> {
    await this.bindTenantContext(user);
    return this.baseService.create(input);
  }
}
