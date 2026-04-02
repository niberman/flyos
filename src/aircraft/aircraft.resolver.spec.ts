// ==========================================================================
// AircraftResolver — Unit Tests
// ==========================================================================
// Tests the GraphQL controller for aircraft operations. Verifies that the
// resolver binds tenant context, delegates to AircraftService, and resolves
// the homeBase field correctly.
// ==========================================================================

import { Test } from '@nestjs/testing';
import {
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AirworthinessStatus } from '@prisma/client';
import { AircraftResolver } from './aircraft.resolver';
import { AircraftService } from './aircraft.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';

const mockAircraftService = {
  findAll: jest.fn(),
  findByBase: jest.fn(),
  create: jest.fn(),
  updateAirworthinessStatus: jest.fn(),
};

const mockPrisma = {
  user: { findUnique: jest.fn() },
  base: { findFirst: jest.fn() },
};

const mockTenantContext = {
  organizationId: null as string | null,
  setOrganization: jest.fn(),
};

const testUser = { userId: 'user-1', role: 'DISPATCHER' };

describe('AircraftResolver', () => {
  let resolver: AircraftResolver;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockTenantContext.organizationId = null;
    const module = await Test.createTestingModule({
      providers: [
        AircraftResolver,
        { provide: AircraftService, useValue: mockAircraftService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantContext, useValue: mockTenantContext },
      ],
    }).compile();
    resolver = module.get(AircraftResolver);
  });

  /** Helper to make bindTenantContext succeed. */
  function setupUserLookup(orgId: string = 'org-1') {
    mockPrisma.user.findUnique.mockResolvedValue({
      organizationId: orgId,
    });
  }

  describe('aircraft (query)', () => {
    it('binds tenant context and returns all aircraft', async () => {
      setupUserLookup();
      const fleet = [
        { id: 'ac-1', tailNumber: 'N111' },
        { id: 'ac-2', tailNumber: 'N222' },
      ];
      mockAircraftService.findAll.mockResolvedValue(fleet);

      const result = await resolver.aircraft(testUser);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { organizationId: true },
      });
      expect(mockTenantContext.setOrganization).toHaveBeenCalledWith('org-1');
      expect(mockAircraftService.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(fleet);
    });

    it('passes optional baseId filter', async () => {
      setupUserLookup();
      mockAircraftService.findAll.mockResolvedValue([]);

      await resolver.aircraft(testUser, 'base-x');

      expect(mockAircraftService.findAll).toHaveBeenCalledWith('base-x');
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(resolver.aircraft(testUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('aircraftByBase (query)', () => {
    it('binds context and delegates to findByBase', async () => {
      setupUserLookup();
      const list = [{ id: 'ac-1' }];
      mockAircraftService.findByBase.mockResolvedValue(list);

      const result = await resolver.aircraftByBase(testUser, 'base-1');

      expect(mockAircraftService.findByBase).toHaveBeenCalledWith('base-1');
      expect(result).toEqual(list);
    });
  });

  describe('homeBase (field resolver)', () => {
    it('resolves the home base for an aircraft', async () => {
      const base = {
        id: 'base-1',
        organizationId: 'org-1',
        name: 'Main Base',
        icaoCode: 'KAPA',
        timezone: 'America/Denver',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.base.findFirst.mockResolvedValue(base);

      const aircraft = {
        homeBaseId: 'base-1',
        organizationId: 'org-1',
      } as any;
      const result = await resolver.homeBase(aircraft);

      expect(result).toEqual(base);
      expect(mockPrisma.base.findFirst).toHaveBeenCalledWith({
        where: { id: 'base-1', organizationId: 'org-1' },
      });
    });

    it('throws NotFoundException when base not found', async () => {
      mockPrisma.base.findFirst.mockResolvedValue(null);

      await expect(
        resolver.homeBase({ homeBaseId: 'gone', organizationId: 'org-1' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAircraft (mutation)', () => {
    it('binds context and creates aircraft', async () => {
      setupUserLookup();
      const input = {
        tailNumber: 'N999',
        make: 'Cessna',
        model: '182',
        homeBaseId: 'base-1',
      };
      const created = { id: 'ac-new', ...input };
      mockAircraftService.create.mockResolvedValue(created);

      const result = await resolver.createAircraft(testUser, input);

      expect(mockAircraftService.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(created);
    });
  });

  describe('updateAircraftStatus (mutation)', () => {
    it('binds context and updates status', async () => {
      setupUserLookup();
      const updated = {
        id: 'ac-1',
        airworthinessStatus: AirworthinessStatus.GROUNDED,
      };
      mockAircraftService.updateAirworthinessStatus.mockResolvedValue(updated);

      const result = await resolver.updateAircraftStatus(
        testUser,
        'ac-1',
        AirworthinessStatus.GROUNDED,
      );

      expect(mockAircraftService.updateAirworthinessStatus).toHaveBeenCalledWith(
        'ac-1',
        AirworthinessStatus.GROUNDED,
      );
      expect(result).toEqual(updated);
    });
  });
});
