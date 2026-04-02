import { Test } from '@nestjs/testing';
import { AirworthinessStatus } from '@prisma/client';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_THRESHOLDS } from './thresholds.config';

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

    it('grounds aircraft when cylinder head temp exceeds configured max', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          organizationId: 'org-1',
          aircraftId: 'ac-1',
          aircraft: { tailNumber: 'N111' },
          data: {
            cylinderHeadTemperature:
              DEFAULT_THRESHOLDS.cylinderHeadTemp.max + 1,
          },
        },
      ]);
      mockPrisma.aircraft.updateMany.mockResolvedValue({ count: 1 });

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['ac-1'] },
          organizationId: 'org-1',
          airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
        },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
    });

    it('grounds aircraft when oil pressure drops below configured minimum', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          organizationId: 'org-1',
          aircraftId: 'ac-2',
          aircraft: { tailNumber: 'N222' },
          data: { oilPressure: DEFAULT_THRESHOLDS.oilPressure.min - 1 },
        },
      ]);
      mockPrisma.aircraft.updateMany.mockResolvedValue({ count: 1 });

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['ac-2'] },
          organizationId: 'org-1',
          airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
        },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
    });

    it('grounds aircraft when oil temperature exceeds 245°F', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          organizationId: 'org-1',
          aircraftId: 'ac-oil-temp',
          aircraft: { tailNumber: 'N777' },
          data: { oilTemperature: DEFAULT_THRESHOLDS.oilTemperature.max + 1 },
        },
      ]);
      mockPrisma.aircraft.updateMany.mockResolvedValue({ count: 1 });

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['ac-oil-temp'] },
          organizationId: 'org-1',
          airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
        },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
    });

    it('grounds aircraft when EGT spread exceeds 50°F', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          organizationId: 'org-1',
          aircraftId: 'ac-egt',
          aircraft: { tailNumber: 'N888' },
          data: { egtSpread: DEFAULT_THRESHOLDS.egtSpread.max + 1 },
        },
      ]);
      mockPrisma.aircraft.updateMany.mockResolvedValue({ count: 1 });

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['ac-egt'] },
          organizationId: 'org-1',
          airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
        },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
    });

    it('grounds aircraft when fuel flow is below minimum', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          organizationId: 'org-1',
          aircraftId: 'ac-ff-low',
          aircraft: { tailNumber: 'N999' },
          data: { fuelFlow: DEFAULT_THRESHOLDS.fuelFlow.min - 0.5 },
        },
      ]);
      mockPrisma.aircraft.updateMany.mockResolvedValue({ count: 1 });

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['ac-ff-low'] },
          organizationId: 'org-1',
          airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
        },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
    });

    it('does not ground aircraft when readings are within thresholds', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          organizationId: 'org-1',
          aircraftId: 'ac-3',
          aircraft: { tailNumber: 'N333' },
          data: {
            cylinderHeadTemperature: DEFAULT_THRESHOLDS.cylinderHeadTemp.max - 1,
            oilPressure: DEFAULT_THRESHOLDS.oilPressure.min + 1,
            oilTemperature: DEFAULT_THRESHOLDS.oilTemperature.max - 1,
            egtSpread: DEFAULT_THRESHOLDS.egtSpread.max - 1,
            fuelFlow: DEFAULT_THRESHOLDS.fuelFlow.min + 0.5,
          },
        },
      ]);

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).not.toHaveBeenCalled();
    });

    it('skips telemetry records with null or non-object data', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          organizationId: 'org-1',
          aircraftId: 'ac-4',
          aircraft: { tailNumber: 'N444' },
          data: null,
        },
        {
          organizationId: 'org-1',
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
          organizationId: 'org-1',
          aircraftId: 'ac-1',
          aircraft: { tailNumber: 'N111' },
          data: {
            cylinderHeadTemperature:
              DEFAULT_THRESHOLDS.cylinderHeadTemp.max + 1,
          },
        },
        {
          organizationId: 'org-1',
          aircraftId: 'ac-1',
          aircraft: { tailNumber: 'N111' },
          data: { oilPressure: DEFAULT_THRESHOLDS.oilPressure.min - 1 },
        },
      ]);
      mockPrisma.aircraft.updateMany.mockResolvedValue({ count: 1 });

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['ac-1'] },
            organizationId: 'org-1',
          }),
        }),
      );
    });

    it('processes organizations independently for grounding updates', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          organizationId: 'org-a',
          aircraftId: 'ac-a',
          aircraft: { tailNumber: 'NA' },
          data: {
            cylinderHeadTemperature:
              DEFAULT_THRESHOLDS.cylinderHeadTemp.max + 1,
          },
        },
        {
          organizationId: 'org-b',
          aircraftId: 'ac-b',
          aircraft: { tailNumber: 'NB' },
          data: {
            cylinderHeadTemperature:
              DEFAULT_THRESHOLDS.cylinderHeadTemp.max + 1,
          },
        },
      ]);
      mockPrisma.aircraft.updateMany.mockResolvedValue({ count: 1 });

      await service.checkTelemetryThresholds();

      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledTimes(2);
      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['ac-a'] },
          organizationId: 'org-a',
          airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
        },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
      expect(mockPrisma.aircraft.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['ac-b'] },
          organizationId: 'org-b',
          airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
        },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
    });
  });

  describe('getAlertHistory', () => {
    it('returns violations with aircraft tail, parameter, value, threshold, timestamp', async () => {
      const ts = new Date('2026-04-01T12:00:00.000Z');
      mockPrisma.telemetry.findMany.mockResolvedValue([
        {
          aircraftId: 'ac-x',
          timestamp: ts,
          data: { oilPressure: DEFAULT_THRESHOLDS.oilPressure.min - 1 },
          aircraft: { tailNumber: 'N321' },
        },
      ]);

      const alerts = await service.getAlertHistory('org-1', undefined, 24);

      expect(mockPrisma.telemetry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            timestamp: expect.any(Object),
          }),
        }),
      );

      expect(alerts).toEqual([
        {
          aircraftId: 'ac-x',
          aircraftTailNumber: 'N321',
          parameter: 'oilPressure',
          value: DEFAULT_THRESHOLDS.oilPressure.min - 1,
          threshold: DEFAULT_THRESHOLDS.oilPressure.min,
          timestamp: ts,
        },
      ]);
    });

    it('filters by aircraftId when provided', async () => {
      mockPrisma.telemetry.findMany.mockResolvedValue([]);

      await service.getAlertHistory('org-1', 'ac-only', 48);

      expect(mockPrisma.telemetry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            aircraftId: 'ac-only',
          }),
        }),
      );
    });
  });
});
