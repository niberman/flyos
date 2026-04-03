import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { Role, SquawkStatus } from '@prisma/client';
import { SquawkType } from './squawk.type';
import { SquawkService } from './squawk.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => SquawkType)
export class SquawkResolver {
  constructor(
    private readonly squawkService: SquawkService,
    private readonly prisma: PrismaService,
  ) {}

  private async requireOrg(userId: string): Promise<string> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    if (!u) throw new UnauthorizedException('User not found.');
    return u.organizationId;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Query(() => [SquawkType], {
    description: 'List squawks for the organization.',
  })
  async squawks(
    @CurrentUser() user: { userId: string },
    @Args('aircraftId', { type: () => ID, nullable: true }) aircraftId?: string,
  ): Promise<SquawkType[]> {
    const organizationId = await this.requireOrg(user.userId);
    return this.squawkService.listForOrganization(
      organizationId,
      aircraftId,
    ) as unknown as SquawkType[];
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Mutation(() => SquawkType)
  async createSquawk(
    @CurrentUser() user: { userId: string },
    @Args('aircraftId', { type: () => ID }) aircraftId: string,
    @Args('title', { type: () => String }) title: string,
    @Args('description', { type: () => String, nullable: true })
    description?: string,
    @Args('groundsAircraft', {
      type: () => Boolean,
      nullable: true,
      defaultValue: false,
    })
    groundsAircraft?: boolean,
  ): Promise<SquawkType> {
    const organizationId = await this.requireOrg(user.userId);
    return this.squawkService.createSquawk(organizationId, {
      aircraftId,
      title,
      description,
      groundsAircraft,
    }) as unknown as SquawkType;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Mutation(() => SquawkType)
  async updateSquawkStatus(
    @CurrentUser() user: { userId: string },
    @Args('squawkId', { type: () => ID }) squawkId: string,
    @Args('status', { type: () => SquawkStatus }) status: SquawkStatus,
  ): Promise<SquawkType> {
    const organizationId = await this.requireOrg(user.userId);
    return this.squawkService.updateSquawkStatus(
      organizationId,
      squawkId,
      status,
    ) as unknown as SquawkType;
  }
}
