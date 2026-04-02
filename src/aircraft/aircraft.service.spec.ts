import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AirworthinessStatus } from '@prisma/client';
import { AircraftService } from './aircraft.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  aircraft: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('AircraftService', () => {
  let service: AircraftService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AircraftService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AircraftService);
  });

  describe('create', () => {
    it('creates an aircraft record', async () => {
      const input = {
        tailNumber: 'N12345',
        make: 'Cessna',
        model: '172',
        organizationId: 'org-1',
        homeBaseId: 'base-1',
      };
      const expected = { id: 'uuid-1', ...input };
      mockPrisma.aircraft.create.mockResolvedValue(expected);

      const result = await service.create(input);

      expect(result).toEqual(expected);
      expect(mockPrisma.aircraft.create).toHaveBeenCalledWith({
        data: {
          tailNumber: 'N12345',
          make: 'Cessna',
          model: '172',
          organizationId: 'org-1',
          homeBaseId: 'base-1',
        },
      });
    });
  });

  describe('findAll', () => {
    it('returns all aircraft', async () => {
      const aircraft = [{ id: '1' }, { id: '2' }];
      mockPrisma.aircraft.findMany.mockResolvedValue(aircraft);

      expect(await service.findAll()).toEqual(aircraft);
    });
  });

  describe('findById', () => {
    it('returns the aircraft when found', async () => {
      const aircraft = { id: 'uuid-1', tailNumber: 'N12345' };
      mockPrisma.aircraft.findUnique.mockResolvedValue(aircraft);

      expect(await service.findById('uuid-1')).toEqual(aircraft);
      expect(mockPrisma.aircraft.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.aircraft.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateAirworthinessStatus', () => {
    it('updates and returns the aircraft', async () => {
      const updated = {
        id: 'uuid-1',
        airworthinessStatus: AirworthinessStatus.GROUNDED,
      };
      mockPrisma.aircraft.update.mockResolvedValue(updated);

      const result = await service.updateAirworthinessStatus(
        'uuid-1',
        AirworthinessStatus.GROUNDED,
      );

      expect(result).toEqual(updated);
      expect(mockPrisma.aircraft.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
      });
    });
  });
});
