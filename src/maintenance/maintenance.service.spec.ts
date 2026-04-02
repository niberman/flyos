import { Test } from '@nestjs/testing';
import { AirworthinessStatus } from '@prisma/client';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  telemetry: { findMany: jest.fn() },
  aircraft: { updateMany: jest.fn() },
};

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(MaintenanceService);
  });

  describe('checkTelemetryThresholds', () => {
    it('does nothing when no recent telemetry exists', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([]);

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).not.toHaveBeenCalled();
    });

    it('grounds aircraft when cylinder head temp exceeds 400°F', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          aircraftId: 'ac-1',
          aircraft: { tailNumber: 'N111' },
          data: { cylinderHeadTemperature: 450 },
        },
      ]);
      mockPrisma.aircraft.updateMany.mockResolvedValue({ count: 1 });

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['ac-1'] },
          airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
        },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
    });

    it('grounds aircraft when oil pressure drops below 30 PSI', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          aircraftId: 'ac-2',
          aircraft: { tailNumber: 'N222' },
          data: { oilPressure: 20 },
        },
      ]);
      mockPrisma.aircraft.updateMany.mockResolvedValue({ count: 1 });

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['ac-2'] },
          airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
        },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
    });

    it('does not ground aircraft when readings are within thresholds', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          aircraftId: 'ac-3',
          aircraft: { tailNumber: 'N333' },
          data: { cylinderHeadTemperature: 350, oilPressure: 45 },
        },
      ]);

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).not.toHaveBeenCalled();
    });

    it('skips telemetry records with null or non-object data', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          aircraftId: 'ac-4',
          aircraft: { tailNumber: 'N444' },
          data: null,
        },
        {
          aircraftId: 'ac-5',
          aircraft: { tailNumber: 'N555' },
          data: 'invalid',
        },
      ]);

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).not.toHaveBeenCalled();
    });

    it('deduplicates aircraft IDs when multiple records violate', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          aircraftId: 'ac-1',
          aircraft: { tailNumber: 'N111' },
          data: { cylinderHeadTemperature: 450 },
        },
        {
          aircraftId: 'ac-1',
          aircraft: { tailNumber: 'N111' },
          data: { oilPressure: 10 },
        },
      ]);
      mockPrisma.aircraft.updateMany.mockResolvedValue({ count: 1 });

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['ac-1'] },
          }),
        }),
      );
    });
  });
});
