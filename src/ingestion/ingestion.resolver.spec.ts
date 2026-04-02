// ==========================================================================
// IngestionResolver — Unit Tests
// ==========================================================================
// Tests the GraphQL controller for batch data ingestion. Verifies that the
// resolver resolves the caller's organization and delegates to IngestionService.
// ==========================================================================

import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { IngestionResolver } from './ingestion.resolver';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';

const mockIngestionService = {
  ingestMaintenanceLogs: jest.fn(),
  ingestTelemetry: jest.fn(),
};

const mockPrisma = {
  user: { findUnique: jest.fn() },
};

const testUser = { userId: 'user-1', role: 'DISPATCHER' };

describe('IngestionResolver', () => {
  let resolver: IngestionResolver;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        IngestionResolver,
        { provide: IngestionService, useValue: mockIngestionService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    resolver = module.get(IngestionResolver);
  });

  function setupUserLookup(orgId: string = 'org-1') {
    mockPrisma.user.findUnique.mockResolvedValue({
      organizationId: orgId,
    });
  }

  describe('ingestMaintenanceLogs', () => {
    it('resolves org and delegates to IngestionService', async () => {
      setupUserLookup('org-maint');
      const input = {
        entries: [{ aircraftId: 'ac-1', data: { note: 'oil change' } }],
      };
      const created = [{ id: 'log-1', aircraftId: 'ac-1' }];
      mockIngestionService.ingestMaintenanceLogs.mockResolvedValue(created);

      const result = await resolver.ingestMaintenanceLogs(testUser, input);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { organizationId: true },
      });
      expect(mockIngestionService.ingestMaintenanceLogs).toHaveBeenCalledWith(
        input,
        'org-maint',
      );
      expect(result).toEqual(created);
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        resolver.ingestMaintenanceLogs(testUser, { entries: [] }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('ingestTelemetry', () => {
    it('resolves org and delegates to IngestionService', async () => {
      setupUserLookup('org-tel');
      const input = {
        entries: [{ aircraftId: 'ac-1', data: { oilPressure: 45 } }],
      };
      const created = [{ id: 'tel-1', aircraftId: 'ac-1' }];
      mockIngestionService.ingestTelemetry.mockResolvedValue(created);

      const result = await resolver.ingestTelemetry(testUser, input);

      expect(mockIngestionService.ingestTelemetry).toHaveBeenCalledWith(
        input,
        'org-tel',
      );
      expect(result).toEqual(created);
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        resolver.ingestTelemetry(testUser, { entries: [] }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
