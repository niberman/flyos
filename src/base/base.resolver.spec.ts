import { Test, TestingModule } from '@nestjs/testing';
import { BaseResolver } from './base.resolver';
import { BaseService } from './base.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('BaseResolver', () => {
  let resolver: BaseResolver;
  let prisma: PrismaService;
  let tenantContext: TenantContext;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    base: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockTenantContext = {
    setOrganization: jest.fn(),
    organizationId: 'org-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BaseResolver,
        BaseService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantContext, useValue: mockTenantContext },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<BaseResolver>(BaseResolver);
    prisma = module.get<PrismaService>(PrismaService);
    tenantContext = module.get<TenantContext>(TenantContext);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('bases', () => {
    it('should return all bases for the organization', async () => {
      const user = { userId: 'user-1', role: 'STUDENT' };
      const mockBases = [
        {
          id: 'base-1',
          name: 'Base 1',
          icaoCode: 'KAPA',
          organizationId: 'org-1',
        },
      ];

      mockPrisma.user.findUnique.mockResolvedValue({ organizationId: 'org-1' });
      mockPrisma.base.findMany.mockResolvedValue(mockBases);

      const result = await resolver.bases(user);

      expect(result).toEqual(mockBases);
      expect(mockTenantContext.setOrganization).toHaveBeenCalledWith('org-1');
      expect(mockPrisma.base.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        orderBy: { name: 'asc' },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const user = { userId: 'user-1', role: 'STUDENT' };
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(resolver.bases(user)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createBase', () => {
    it('delegates to BaseService.create after binding tenant', async () => {
      const user = { userId: 'user-1', role: 'DISPATCHER' };
      const input = {
        name: 'Test Base',
        icaoCode: 'KZZZ',
        timezone: 'America/Denver',
      };
      const created = {
        id: 'base-new',
        organizationId: 'org-1',
        ...input,
        icaoCode: 'KZZZ',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue({ organizationId: 'org-1' });
      mockPrisma.base.findFirst.mockResolvedValue(null);
      mockPrisma.base.create.mockResolvedValue(created);

      const result = await resolver.createBase(user, input);

      expect(result).toEqual(created);
      expect(mockTenantContext.setOrganization).toHaveBeenCalledWith('org-1');
      expect(mockPrisma.base.create).toHaveBeenCalled();
    });
  });
});
