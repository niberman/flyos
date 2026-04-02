// ==========================================================================
// MaintenanceResolver — Unit Tests
// ==========================================================================
// Tests the GraphQL controller for predictive maintenance alerts. Verifies
// that the resolver resolves the caller's organization and delegates to
// MaintenanceService for alert history queries.
// ==========================================================================

import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { MaintenanceResolver } from './maintenance.resolver';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from '../prisma/prisma.service';

const mockMaintenanceService = {
  getAlertHistory: jest.fn(),
};

const mockPrisma = {
  user: { findUnique: jest.fn() },
};

const testUser = { userId: 'user-1' };

describe('MaintenanceResolver', () => {
  let resolver: MaintenanceResolver;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        MaintenanceResolver,
        { provide: MaintenanceService, useValue: mockMaintenanceService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    resolver = module.get(MaintenanceResolver);
  });

  function setupUserLookup(orgId: string = 'org-1') {
    mockPrisma.user.findUnique.mockResolvedValue({
      organizationId: orgId,
    });
  }

  describe('alertHistory', () => {
    it('resolves org and returns alert history with defaults', async () => {
      setupUserLookup('org-alerts');
      const alerts = [
        {
          aircraftId: 'ac-1',
          aircraftTailNumber: 'N111',
          parameter: 'oilPressure',
          value: 20,
          threshold: 25,
          timestamp: new Date(),
        },
      ];
      mockMaintenanceService.getAlertHistory.mockResolvedValue(alerts);

      const result = await resolver.alertHistory(testUser);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { organizationId: true },
      });
      expect(mockMaintenanceService.getAlertHistory).toHaveBeenCalledWith(
        'org-alerts',
        undefined,
        24,
      );
      expect(result).toEqual(alerts);
    });

    it('passes optional aircraftId and hours arguments', async () => {
      setupUserLookup('org-1');
      mockMaintenanceService.getAlertHistory.mockResolvedValue([]);

      await resolver.alertHistory(testUser, 'ac-specific', 48);

      expect(mockMaintenanceService.getAlertHistory).toHaveBeenCalledWith(
        'org-1',
        'ac-specific',
        48,
      );
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(resolver.alertHistory(testUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('defaults hours to 24 when null is passed', async () => {
      setupUserLookup();
      mockMaintenanceService.getAlertHistory.mockResolvedValue([]);

      await resolver.alertHistory(testUser, undefined, null as any);

      expect(mockMaintenanceService.getAlertHistory).toHaveBeenCalledWith(
        'org-1',
        undefined,
        24,
      );
    });
  });
});
