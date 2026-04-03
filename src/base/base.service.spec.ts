import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { BaseService } from './base.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';

describe('BaseService', () => {
  let service: BaseService;
  const mockPrisma = {
    base: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
  const mockTenant = {
    organizationId: 'org-1' as string | null,
    setOrganization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTenant.organizationId = 'org-1';
    service = new BaseService(
      mockPrisma as unknown as PrismaService,
      mockTenant as unknown as TenantContext,
    );
  });

  describe('create', () => {
    it('creates a base with normalized ICAO', async () => {
      mockPrisma.base.findFirst.mockResolvedValue(null);
      const created = {
        id: 'base-new',
        organizationId: 'org-1',
        name: 'North Field',
        icaoCode: 'KDEN',
        timezone: 'America/Denver',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.base.create.mockResolvedValue(created);

      const result = await service.create({
        name: '  North Field  ',
        icaoCode: 'kden',
        timezone: ' America/Denver ',
      });

      expect(result).toEqual(created);
      expect(mockPrisma.base.findFirst).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', icaoCode: 'KDEN' },
      });
      expect(mockPrisma.base.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          name: 'North Field',
          icaoCode: 'KDEN',
          timezone: 'America/Denver',
        },
      });
    });

    it('throws ConflictException when ICAO exists', async () => {
      mockPrisma.base.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          name: 'Dup',
          icaoCode: 'KAPA',
          timezone: 'America/Denver',
        }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.base.create).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException without org context', async () => {
      mockTenant.organizationId = null;

      await expect(
        service.create({
          name: 'X',
          icaoCode: 'KXXX',
          timezone: 'UTC',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
