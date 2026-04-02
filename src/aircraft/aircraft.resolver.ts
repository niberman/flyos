// ==========================================================================
// AircraftResolver — GraphQL Controller for Aircraft Operations
// ==========================================================================
// This resolver is the **Controller** in the MVC pattern for aircraft.
// It defines the GraphQL queries and mutations, applies access control
// guards, and delegates to AircraftService for business logic.
//
// Access Control:
//   - aircraft (query):       Any authenticated user can view the fleet.
//   - createAircraft:         DISPATCHER only — fleet management.
//   - updateAircraftStatus:   INSTRUCTOR and DISPATCHER — maintenance ops.
//
// Data Flow:
//   Client → GraphQL Engine → AircraftResolver (Controller) →
//   AircraftService (Logic) → PrismaService (Model) → PostgreSQL →
//   AircraftType (View) returned to client.
// ==========================================================================

import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import {
  NotFoundException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AircraftType } from './aircraft.type';
import { BaseType } from '../base/base.type';
import { AircraftService } from './aircraft.service';
import { CreateAircraftInput } from './dto/create-aircraft.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, AirworthinessStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';

@Resolver(() => AircraftType)
export class AircraftResolver {
  constructor(
    private readonly aircraftService: AircraftService,
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

  /**
   * Query: aircraft
   * Returns all aircraft in the fleet. Available to any authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => [AircraftType], {
    description: 'List all aircraft in the fleet.',
  })
  async aircraft(
    @CurrentUser() user: { userId: string; role: string },
    @Args('baseId', { type: () => ID, nullable: true }) baseId?: string,
  ): Promise<AircraftType[]> {
    await this.bindTenantContext(user);
    return this.aircraftService.findAll(baseId ?? undefined);
  }

  /**
   * Query: aircraftByBase
   * Aircraft at a base (home base or currently booked there).
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => [AircraftType], {
    description:
      'List aircraft at a base: home-based there or with a booking at that base.',
  })
  async aircraftByBase(
    @CurrentUser() user: { userId: string; role: string },
    @Args('baseId', { type: () => ID }) baseId: string,
  ): Promise<AircraftType[]> {
    await this.bindTenantContext(user);
    return this.aircraftService.findByBase(baseId);
  }

  @ResolveField(() => Number)
  hobbsHours(@Parent() aircraft: { hobbsHours: { toString(): string } | number }) {
    return Number(aircraft.hobbsHours);
  }

  @ResolveField(() => Number)
  tachHours(@Parent() aircraft: { tachHours: { toString(): string } | number }) {
    return Number(aircraft.tachHours);
  }

  @ResolveField(() => BaseType)
  async homeBase(@Parent() aircraft: AircraftType): Promise<BaseType> {
    const row = await this.prisma.base.findFirst({
      where: {
        id: aircraft.homeBaseId,
        organizationId: aircraft.organizationId,
      },
    });
    if (!row) {
      throw new NotFoundException('Home base not found for this aircraft.');
    }
    return row;
  }

  /**
   * Mutation: createAircraft
   * Adds a new aircraft to the fleet. Restricted to DISPATCHER role.
   *
   * This demonstrates RBAC enforcement: the JwtAuthGuard verifies the token,
   * then the RolesGuard checks that the user has the DISPATCHER role.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISPATCHER)
  @Mutation(() => AircraftType, {
    description: 'Add a new aircraft to the fleet. DISPATCHER only.',
  })
  async createAircraft(
    @CurrentUser() user: { userId: string; role: string },
    @Args('input') input: CreateAircraftInput,
  ): Promise<AircraftType> {
    await this.bindTenantContext(user);
    return this.aircraftService.create(input);
  }

  /**
   * Mutation: updateAircraftStatus
   * Manually updates an aircraft's airworthiness status.
   * Restricted to INSTRUCTOR and DISPATCHER roles.
   *
   * Note: The predictive maintenance engine also updates this status
   * automatically — this mutation provides manual override capability.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.DISPATCHER)
  @Mutation(() => AircraftType, {
    description:
      'Update aircraft airworthiness status. INSTRUCTOR and DISPATCHER only.',
  })
  async updateAircraftStatus(
    @CurrentUser() user: { userId: string; role: string },
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => AirworthinessStatus })
    status: AirworthinessStatus,
  ): Promise<AircraftType> {
    await this.bindTenantContext(user);
    return this.aircraftService.updateAirworthinessStatus(id, status);
  }
}
