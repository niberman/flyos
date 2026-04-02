// ==========================================================================
// AircraftService — Business Logic for Aircraft Operations
// ==========================================================================
// This service manages CRUD operations and status updates for aircraft.
// In the MVC pattern, it sits between the Controller (AircraftResolver)
// and the Model (PrismaService).
//
// Key Responsibility:
//   Fleet listing and creation are scoped to the request organization.
//   Status updates from the maintenance job use Prisma directly.
//
// Data Flow:
//   AircraftResolver → AircraftService → PrismaService → PostgreSQL
// ==========================================================================

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AirworthinessStatus,
  BookingStatus,
  SchedulableResourceKind,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';
import { CreateAircraftInput } from './dto/create-aircraft.input';

@Injectable()
export class AircraftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private requireOrganizationId(): string {
    const organizationId = this.tenantContext.organizationId;
    if (!organizationId) {
      throw new UnauthorizedException('Missing organization context.');
    }
    return organizationId;
  }

  /**
   * Creates a new aircraft record in the database.
   * New aircraft default to FLIGHT_READY status (set in Prisma schema).
   */
  async create(input: CreateAircraftInput) {
    const organizationId = this.requireOrganizationId();

    const homeBase = await this.prisma.base.findFirst({
      where: { id: input.homeBaseId, organizationId },
    });
    if (!homeBase) {
      throw new BadRequestException(
        'homeBaseId must reference a base in your organization.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const aircraft = await tx.aircraft.create({
        data: {
          tailNumber: input.tailNumber,
          make: input.make,
          model: input.model,
          organizationId,
          homeBaseId: input.homeBaseId,
        },
      });
      await tx.schedulableResource.create({
        data: {
          organizationId,
          baseId: input.homeBaseId,
          kind: SchedulableResourceKind.AIRCRAFT,
          name: input.tailNumber,
          aircraftId: aircraft.id,
        },
      });
      return aircraft;
    });
  }

  /**
   * Retrieves aircraft for the current organization, optionally filtered by home base.
   */
  async findAll(homeBaseId?: string) {
    const organizationId = this.requireOrganizationId();
    return this.prisma.aircraft.findMany({
      where: {
        organizationId,
        ...(homeBaseId ? { homeBaseId } : {}),
      },
    });
  }

  /**
   * Retrieves a single aircraft by UUID within the current organization.
   * @throws NotFoundException if no aircraft exists with the given ID.
   */
  async findById(id: string) {
    const organizationId = this.requireOrganizationId();
    const aircraft = await this.prisma.aircraft.findFirst({
      where: { id, organizationId },
    });
    if (!aircraft) {
      throw new NotFoundException(`Aircraft with ID "${id}" not found.`);
    }
    return aircraft;
  }

  /**
   * Aircraft whose home base is `baseId`, plus any same-org aircraft with an active
   * booking at that base (any time window).
   */
  async findByBase(baseId: string) {
    const organizationId = this.requireOrganizationId();

    const base = await this.prisma.base.findFirst({
      where: { id: baseId, organizationId },
    });
    if (!base) {
      throw new NotFoundException(`Base with ID "${baseId}" not found.`);
    }

    return this.prisma.aircraft.findMany({
      where: {
        organizationId,
        OR: [
          { homeBaseId: baseId },
          {
            schedulableResource: {
              bookings: {
                some: { baseId, status: { not: BookingStatus.CANCELLED } },
              },
            },
          },
        ],
      },
    });
  }

  /**
   * Updates the airworthiness status of an aircraft (GraphQL mutation path).
   * The predictive maintenance job updates status via Prisma directly.
   *
   * @param id - The aircraft UUID.
   * @param status - The new AirworthinessStatus (FLIGHT_READY or GROUNDED).
   */
  async updateAirworthinessStatus(id: string, status: AirworthinessStatus) {
    const organizationId = this.requireOrganizationId();

    const existing = await this.prisma.aircraft.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException(`Aircraft with ID "${id}" not found.`);
    }

    return this.prisma.aircraft.update({
      where: { id },
      data: { airworthinessStatus: status },
    });
  }
}
