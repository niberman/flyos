import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      const users = [{ id: '1', email: 'a@b.com' }];
      mockPrisma.user.findMany.mockResolvedValue(users);

      expect(await service.findAll()).toEqual(users);
    });
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      const user = { id: 'uuid-1', email: 'a@b.com' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      expect(await service.findById('uuid-1')).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
