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

import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AircraftType } from './aircraft.type';
import { AircraftService } from './aircraft.service';
import { CreateAircraftInput } from './dto/create-aircraft.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, AirworthinessStatus } from '@prisma/client';

@Resolver(() => AircraftType)
export class AircraftResolver {
  constructor(private readonly aircraftService: AircraftService) {}

  /**
   * Query: aircraft
   * Returns all aircraft in the fleet. Available to any authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => [AircraftType], {
    description: 'List all aircraft in the fleet.',
  })
  async aircraft(): Promise<AircraftType[]> {
    return this.aircraftService.findAll();
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
    @Args('input') input: CreateAircraftInput,
  ): Promise<AircraftType> {
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
    @Args('id') id: string,
    @Args('status', { type: () => AirworthinessStatus })
    status: AirworthinessStatus,
  ): Promise<AircraftType> {
    return this.aircraftService.updateAirworthinessStatus(id, status);
  }
}
