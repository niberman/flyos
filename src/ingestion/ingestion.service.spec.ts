import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';

const ORG_ID = 'org-1';

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
    mockPrisma.$transaction.mockImplementation((ops: unknown) => {
      if (Array.isArray(ops)) {
        return Promise.all(ops as Promise<unknown>[]);
      }
      return Promise.reject(new Error('unexpected transaction shape'));
    });
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
        service.ingestMaintenanceLogs(
          {
            entries: [
              { aircraftId: 'missing-id', data: { note: 'oil change' } },
            ],
          },
          ORG_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects batch if any aircraft belongs to a different organization', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([{ id: 'ac-1' }]);

      await expect(
        service.ingestMaintenanceLogs(
          {
            entries: [
              { aircraftId: 'ac-1', data: {} },
              { aircraftId: 'ac-2', data: {} },
            ],
          },
          ORG_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.aircraft.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['ac-1', 'ac-2'] }, organizationId: ORG_ID },
        select: { id: true },
      });
    });

    it('creates maintenance logs in a transaction', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([{ id: 'ac-1' }]);
      mockPrisma.maintenanceLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await service.ingestMaintenanceLogs(
        {
          entries: [{ aircraftId: 'ac-1', data: { note: 'oil change' } }],
        },
        ORG_ID,
      );

      expect(result).toEqual([{ id: 'log-1' }]);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('sets organizationId on all created maintenance log records', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([
        { id: 'ac-1' },
        { id: 'ac-2' },
      ]);
      mockPrisma.maintenanceLog.create
        .mockResolvedValueOnce({ id: 'log-1' })
        .mockResolvedValueOnce({ id: 'log-2' });

      await service.ingestMaintenanceLogs(
        {
          entries: [
            { aircraftId: 'ac-1', data: { a: 1 } },
            { aircraftId: 'ac-2', data: { b: 2 } },
          ],
        },
        ORG_ID,
      );

      expect(mockPrisma.maintenanceLog.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          aircraftId: 'ac-1',
          organizationId: ORG_ID,
          data: { a: 1 },
        }),
      });
      expect(mockPrisma.maintenanceLog.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          aircraftId: 'ac-2',
          organizationId: ORG_ID,
          data: { b: 2 },
        }),
      });
    });

    it('validates all unique aircraft IDs in batch', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([{ id: 'ac-1' }]);

      await expect(
        service.ingestMaintenanceLogs(
          {
            entries: [
              { aircraftId: 'ac-1', data: {} },
              { aircraftId: 'ac-2', data: {} },
            ],
          },
          ORG_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('ingestTelemetry', () => {
    it('throws when referenced aircraft does not exist', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([]);

      await expect(
        service.ingestTelemetry(
          {
            entries: [
              {
                aircraftId: 'missing-id',
                data: { oilPressure: 45 },
              },
            ],
          },
          ORG_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects batch if any aircraft belongs to a different organization', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([{ id: 'ac-1' }]);

      await expect(
        service.ingestTelemetry(
          {
            entries: [
              { aircraftId: 'ac-1', data: { oilPressure: 40 } },
              { aircraftId: 'ac-other-org', data: { oilPressure: 40 } },
            ],
          },
          ORG_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates telemetry records in a transaction', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([{ id: 'ac-1' }]);
      mockPrisma.telemetry.create.mockResolvedValue({ id: 'tel-1' });

      const result = await service.ingestTelemetry(
        {
          entries: [{ aircraftId: 'ac-1', data: { oilPressure: 45 } }],
        },
        ORG_ID,
      );

      expect(result).toEqual([{ id: 'tel-1' }]);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('sets organizationId on all created telemetry records', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([{ id: 'ac-1' }]);
      mockPrisma.telemetry.create
        .mockResolvedValueOnce({ id: 't1' })
        .mockResolvedValueOnce({ id: 't2' });

      await service.ingestTelemetry(
        {
          entries: [
            { aircraftId: 'ac-1', data: { oilPressure: 40 } },
            { aircraftId: 'ac-1', data: { oilPressure: 41 } },
          ],
        },
        ORG_ID,
      );

      expect(mockPrisma.telemetry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          aircraftId: 'ac-1',
          organizationId: ORG_ID,
        }),
      });
      expect(mockPrisma.telemetry.create).toHaveBeenCalledTimes(2);
    });
  });
});
