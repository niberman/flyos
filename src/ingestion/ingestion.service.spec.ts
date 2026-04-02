import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  aircraft: { findMany: jest.fn() },
  maintenanceLog: { create: jest.fn() },
  telemetry: { create: jest.fn() },
  $transaction: jest.fn(),
};

describe('IngestionService', () => {
  let service: IngestionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(IngestionService);
  });

  describe('ingestMaintenanceLogs', () => {
    it('throws when referenced aircraft does not exist', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([]);

      await expect(
        service.ingestMaintenanceLogs({
          entries: [
            { aircraftId: 'missing-id', data: { note: 'oil change' } },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates maintenance logs in a transaction', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([{ id: 'ac-1' }]);
      const created = [{ id: 'log-1' }];
      mockPrisma.$transaction.mockResolvedValue(created);

      const result = await service.ingestMaintenanceLogs({
        entries: [{ aircraftId: 'ac-1', data: { note: 'oil change' } }],
      });

      expect(result).toEqual(created);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('validates all unique aircraft IDs in batch', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([{ id: 'ac-1' }]);

      await expect(
        service.ingestMaintenanceLogs({
          entries: [
            { aircraftId: 'ac-1', data: {} },
            { aircraftId: 'ac-2', data: {} },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('ingestTelemetry', () => {
    it('throws when referenced aircraft does not exist', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([]);

      await expect(
        service.ingestTelemetry({
          entries: [
            {
              aircraftId: 'missing-id',
              data: { oilPressure: 45 },
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates telemetry records in a transaction', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([{ id: 'ac-1' }]);
      const created = [{ id: 'tel-1' }];
      mockPrisma.$transaction.mockResolvedValue(created);

      const result = await service.ingestTelemetry({
        entries: [{ aircraftId: 'ac-1', data: { oilPressure: 45 } }],
      });

      expect(result).toEqual(created);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
