import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('signed-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  describe('register', () => {
    const input = {
      email: 'test@example.com',
      password: 'password123',
      role: Role.STUDENT,
      organizationId: 'org-1',
    };

    it('throws ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.register(input)).rejects.toThrow(ConflictException);
    });

    it('hashes password and creates user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user',
        role: Role.STUDENT,
      });

      const result = await service.register(input);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-pw',
          role: Role.STUDENT,
          organizationId: 'org-1',
        },
      });
      expect(result).toEqual({ access_token: 'signed-token' });
    });
  });

  describe('login', () => {
    const input = { email: 'test@example.com', password: 'password123' };

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(input)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: 'stored-hash',
        role: Role.STUDENT,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(input)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns a JWT when credentials are valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: 'stored-hash',
        role: Role.INSTRUCTOR,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(input);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'stored-hash');
      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        role: Role.INSTRUCTOR,
      });
      expect(result).toEqual({ access_token: 'signed-token' });
    });
  });
});
