import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AirworthinessStatus, SquawkStatus } from '@prisma/client';
import { SquawkService } from './squawk.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SquawkService', () => {
  let service: SquawkService;
  const mockPrisma = {
    aircraft: { findFirst: jest.fn(), update: jest.fn() },
    squawk: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SquawkService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(SquawkService);
  });

  it('createSquawk grounds aircraft when groundsAircraft is true', async () => {
    mockPrisma.aircraft.findFirst.mockResolvedValue({
      id: 'ac-1',
      organizationId: 'org-1',
    });
    mockPrisma.squawk.create.mockResolvedValue({
      id: 'sq-1',
      aircraftId: 'ac-1',
      status: SquawkStatus.OPEN,
      groundsAircraft: true,
    });

    await service.createSquawk('org-1', {
      aircraftId: 'ac-1',
      title: 'Oil leak',
      groundsAircraft: true,
    });

    expect(mockPrisma.aircraft.update).toHaveBeenCalledWith({
      where: { id: 'ac-1' },
      data: { airworthinessStatus: AirworthinessStatus.GROUNDED },
    });
  });

  it('createSquawk rejects unknown aircraft', async () => {
    mockPrisma.aircraft.findFirst.mockResolvedValue(null);

    await expect(
      service.createSquawk('org-1', {
        aircraftId: 'missing',
        title: 'x',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
