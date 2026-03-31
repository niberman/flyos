// ==========================================================================
// AircraftService — Business Logic for Aircraft Operations
// ==========================================================================
// This service manages CRUD operations and status updates for aircraft.
// In the MVC pattern, it sits between the Controller (AircraftResolver)
// and the Model (PrismaService).
//
// Key Responsibility:
//   The updateAirworthinessStatus method is called by the predictive
//   maintenance cron job when telemetry thresholds are violated, which
//   automatically grounds unsafe aircraft.
//
// Data Flow:
//   AircraftResolver → AircraftService → PrismaService → PostgreSQL
// ==========================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { AirworthinessStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAircraftInput } from './dto/create-aircraft.input';

@Injectable()
export class AircraftService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new aircraft record in the database.
   * New aircraft default to FLIGHT_READY status (set in Prisma schema).
   */
  async create(input: CreateAircraftInput) {
    return this.prisma.aircraft.create({
      data: {
        tailNumber: input.tailNumber,
        make: input.make,
        model: input.model,
      },
    });
  }

  /**
   * Retrieves all aircraft in the fleet.
   */
  async findAll() {
    return this.prisma.aircraft.findMany();
  }

  /**
   * Retrieves a single aircraft by UUID.
   * @throws NotFoundException if no aircraft exists with the given ID.
   */
  async findById(id: string) {
    const aircraft = await this.prisma.aircraft.findUnique({ where: { id } });
    if (!aircraft) {
      throw new NotFoundException(`Aircraft with ID "${id}" not found.`);
    }
    return aircraft;
  }

  /**
   * Updates the airworthiness status of an aircraft.
   * This method is called by:
   *   1. The predictive maintenance engine (automatic grounding).
   *   2. DISPATCHER users (manual status changes via GraphQL mutation).
   *
   * @param id - The aircraft UUID.
   * @param status - The new AirworthinessStatus (FLIGHT_READY or GROUNDED).
   */
  async updateAirworthinessStatus(id: string, status: AirworthinessStatus) {
    return this.prisma.aircraft.update({
      where: { id },
      data: { airworthinessStatus: status },
    });
  }
}
