// ==========================================================================
// UsersResolver — Unit Tests
// ==========================================================================
// Tests the GraphQL controller for user queries. Verifies that the
// resolver delegates to UsersService for both the `me` and `users` queries.
// ==========================================================================

import { Test } from '@nestjs/testing';
import { CanActivate, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

/** Stub guard so resolver unit tests do not pull in Prisma/Config/Passport. */
const allowAllGuard: CanActivate = { canActivate: () => true };

const mockUsersService = {
  findById: jest.fn(),
  findAll: jest.fn(),
};

describe('UsersResolver', () => {
  let resolver: UsersResolver;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersResolver,
        { provide: UsersService, useValue: mockUsersService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowAllGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowAllGuard)
      .compile();
    resolver = module.get(UsersResolver);
  });

  describe('me', () => {
    it('returns the authenticated user profile', async () => {
      const user = {
        id: 'user-1',
        email: 'me@flyos.com',
        role: Role.STUDENT,
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsersService.findById.mockResolvedValue(user);

      const result = await resolver.me({
        userId: 'user-1',
        role: Role.STUDENT,
      });

      expect(mockUsersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(user);
    });

    it('propagates NotFoundException when user not found', async () => {
      mockUsersService.findById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        resolver.me({ userId: 'missing', role: Role.STUDENT }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('users', () => {
    it('returns all users', async () => {
      const users = [
        { id: '1', email: 'a@b.com', role: Role.STUDENT },
        { id: '2', email: 'c@d.com', role: Role.INSTRUCTOR },
      ];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await resolver.users();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it('returns empty array when no users exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await resolver.users();

      expect(result).toEqual([]);
    });
  });
});
