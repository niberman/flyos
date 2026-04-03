import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AirworthinessStatus, BookingStatus } from '@prisma/client';
import { AircraftService } from './aircraft.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';

const ORG_ID = 'org-1';

const mockPrisma = {
  aircraft: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  schedulableResource: {
    create: jest.fn(),
  },
  base: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
};

function makeTenantContext(orgId: string | null): TenantContext {
  return { organizationId: orgId } as unknown as TenantContext;
}

describe('AircraftService', () => {
  let service: AircraftService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AircraftService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantContext, useValue: makeTenantContext(ORG_ID) },
      ],
    }).compile();
    service = module.get(AircraftService);
  });

  describe('create', () => {
    it('creates an aircraft record when home base belongs to the org', async () => {
      const input = {
        tailNumber: 'N12345',
        make: 'Cessna',
        model: '172',
        homeBaseId: 'base-1',
      };
      mockPrisma.base.findFirst.mockResolvedValue({
        id: 'base-1',
        organizationId: ORG_ID,
      });
      const expected = {
        id: 'uuid-1',
        organizationId: ORG_ID,
        ...input,
      };
      const txStub = {
        aircraft: {
          create: jest.fn().mockResolvedValue(expected),
        },
        schedulableResource: {
          create: jest.fn().mockResolvedValue({}),
        },
      };
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(txStub));

      const result = await service.create(input);

      expect(result).toEqual(expected);
      expect(mockPrisma.base.findFirst).toHaveBeenCalledWith({
        where: { id: 'base-1', organizationId: ORG_ID },
      });
      expect(txStub.aircraft.create).toHaveBeenCalled();
      expect(txStub.schedulableResource.create).toHaveBeenCalled();
    });

    it('rejects create when homeBaseId belongs to a different organization', async () => {
      mockPrisma.base.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          tailNumber: 'N99999',
          make: 'Piper',
          model: 'PA-28',
          homeBaseId: 'other-org-base',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filters by organizationId', async () => {
      const aircraft = [
        { id: '1', organizationId: ORG_ID, homeBaseId: 'b1' },
        { id: '2', organizationId: ORG_ID, homeBaseId: 'b2' },
      ];
      mockPrisma.aircraft.findMany.mockResolvedValue(aircraft);

      expect(await service.findAll()).toEqual(aircraft);
      expect(mockPrisma.aircraft.findMany).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID },
      });
    });

    it('optionally filters by home base id', async () => {
      mockPrisma.aircraft.findMany.mockResolvedValue([]);

      await service.findAll('base-x');

      expect(mockPrisma.aircraft.findMany).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID, homeBaseId: 'base-x' },
      });
    });
  });

  describe('findById', () => {
    it('returns the aircraft when found', async () => {
      const aircraft = {
        id: 'uuid-1',
        tailNumber: 'N12345',
        organizationId: ORG_ID,
        homeBaseId: 'base-1',
      };
      mockPrisma.aircraft.findFirst.mockResolvedValue(aircraft);

      expect(await service.findById('uuid-1')).toEqual(aircraft);
      expect(mockPrisma.aircraft.findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid-1', organizationId: ORG_ID },
      });
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.aircraft.findFirst.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByBase', () => {
    it('returns aircraft at home base or booked at that base', async () => {
      mockPrisma.base.findFirst.mockResolvedValue({
        id: 'base-1',
        organizationId: ORG_ID,
      });
      const list = [
        {
          id: 'a1',
          organizationId: ORG_ID,
          homeBaseId: 'base-1',
        },
      ];
      mockPrisma.aircraft.findMany.mockResolvedValue(list);

      const result = await service.findByBase('base-1');

      expect(result).toEqual(list);
      expect(mockPrisma.base.findFirst).toHaveBeenCalledWith({
        where: { id: 'base-1', organizationId: ORG_ID },
      });
      expect(mockPrisma.aircraft.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: ORG_ID,
          OR: [
            { homeBaseId: 'base-1' },
            {
              schedulableResource: {
                bookings: {
                  some: {
                    baseId: 'base-1',
                    status: { not: BookingStatus.CANCELLED },
                  },
                },
              },
            },
          ],
        },
      });
    });
  });

  describe('updateAirworthinessStatus', () => {
    it('updates and returns the aircraft when it belongs to the org', async () => {
      mockPrisma.aircraft.findFirst.mockResolvedValue({
        id: 'uuid-1',
        organizationId: ORG_ID,
        homeBaseId: 'base-1',
      });
      const updated = {
        id: 'uuid-1',
        airworthinessStatus: AirworthinessStatus.GROUNDED,
        organizationId: ORG_ID,
        homeBaseId: 'base-1',
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

    it('rejects update when aircraft is not in the user organization', async () => {
      mockPrisma.aircraft.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAirworthinessStatus(
          'other-org-plane',
          AirworthinessStatus.GROUNDED,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.aircraft.update).not.toHaveBeenCalled();
    });
  });

  describe('tenant context', () => {
    it('throws when organization context is missing', async () => {
      const module = await Test.createTestingModule({
        providers: [
          AircraftService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: TenantContext, useValue: makeTenantContext(null) },
        ],
      }).compile();
      const svc = module.get(AircraftService);

      await expect(svc.findAll()).rejects.toThrow(UnauthorizedException);
    });
  });
});
