import { Test } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
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
  organization: {
    findUnique: jest.fn(),
  },
  userBase: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
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
    const baseInput = {
      email: 'test@example.com',
      password: 'password123',
      role: Role.STUDENT,
    };

    it('throws ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          ...baseInput,
          organizationId: 'org-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes password and creates user when organizationId is provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        bases: [{ id: 'base-1' }],
      });
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user',
        role: Role.STUDENT,
        organizationId: 'org-1',
      });
      mockPrisma.userBase.create.mockResolvedValue({});

      const result = await service.register({
        ...baseInput,
        organizationId: 'org-1',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        include: {
          bases: { take: 1, orderBy: { createdAt: 'asc' } },
        },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-pw',
          role: Role.STUDENT,
          organizationId: 'org-1',
        },
      });
      expect(mockPrisma.userBase.create).toHaveBeenCalledWith({
        data: { userId: 'new-user', baseId: 'base-1' },
      });
      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: 'new-user',
        role: Role.STUDENT,
        organizationId: 'org-1',
      });
      expect(result).toEqual({
        access_token: 'signed-token',
        organizationId: 'org-1',
      });
    });

    it('throws BadRequestException when organizationId does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.register({
          ...baseInput,
          organizationId: 'missing-org',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.register({
          ...baseInput,
          organizationId: 'missing-org',
        }),
      ).rejects.toThrow('Organization not found');
    });

    it('throws BadRequestException when existing organization has no base', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        bases: [],
      });

      await expect(
        service.register({
          ...baseInput,
          organizationId: 'org-1',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.register({
          ...baseInput,
          organizationId: 'org-1',
        }),
      ).rejects.toThrow(
        'Organization has no base. Add a base before inviting users.',
      );
    });

    it('registering with organizationName creates org, base, user, and UserBase', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

      const txOrg = { id: 'org-created' };
      const txBase = { id: 'base-created' };
      const txUser = { id: 'user-created', role: Role.STUDENT };

      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            organization: {
              create: jest.fn().mockResolvedValue(txOrg),
            },
            base: {
              create: jest.fn().mockResolvedValue(txBase),
            },
            user: {
              create: jest.fn().mockResolvedValue(txUser),
            },
            userBase: {
              create: jest.fn().mockResolvedValue({}),
            },
          };
          return fn(tx);
        },
      );

      const result = await service.register({
        ...baseInput,
        organizationName: 'Acme Flight School',
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: 'user-created',
        role: Role.STUDENT,
        organizationId: 'org-created',
      });
      expect(result).toEqual({
        access_token: 'signed-token',
        organizationId: 'org-created',
      });
    });

    it('increments the organization slug when the base slug already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockPrisma.organization.findUnique
        .mockResolvedValueOnce({ id: 'org-existing' })
        .mockResolvedValueOnce(null);

      const createOrganization = jest
        .fn()
        .mockResolvedValue({ id: 'org-created' });
      const createBase = jest.fn().mockResolvedValue({ id: 'base-created' });
      const createUser = jest
        .fn()
        .mockResolvedValue({ id: 'user-created', role: Role.STUDENT });
      const createUserBase = jest.fn().mockResolvedValue({});

      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) =>
          fn({
            organization: { create: createOrganization },
            base: { create: createBase },
            user: { create: createUser },
            userBase: { create: createUserBase },
          }),
      );

      await service.register({
        ...baseInput,
        organizationName: 'Acme Flight School',
      });

      expect(mockPrisma.organization.findUnique).toHaveBeenNthCalledWith(1, {
        where: { slug: 'acme-flight-school' },
      });
      expect(mockPrisma.organization.findUnique).toHaveBeenNthCalledWith(2, {
        where: { slug: 'acme-flight-school-1' },
      });
      expect(createOrganization).toHaveBeenCalledWith({
        data: {
          name: 'Acme Flight School',
          slug: 'acme-flight-school-1',
        },
      });
    });

    it('registering with organizationId adds user to existing org', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'existing-org',
        bases: [{ id: 'default-base' }],
      });
      mockPrisma.user.create.mockResolvedValue({
        id: 'u1',
        role: Role.INSTRUCTOR,
        organizationId: 'existing-org',
      });
      mockPrisma.userBase.create.mockResolvedValue({});

      await service.register({
        email: 'joiner@example.com',
        password: 'password123',
        role: Role.INSTRUCTOR,
        organizationId: 'existing-org',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'joiner@example.com',
          passwordHash: 'hashed-pw',
          role: Role.INSTRUCTOR,
          organizationId: 'existing-org',
        },
      });
      expect(mockPrisma.userBase.create).toHaveBeenCalledWith({
        data: { userId: 'u1', baseId: 'default-base' },
      });
    });

    it('registering without org info throws BadRequestException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.register({
          email: 'a@b.com',
          password: 'password123',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.register({
          email: 'a@b.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Organization is required');
    });
  });

  describe('login', () => {
    const input = { email: 'test@example.com', password: 'password123' };

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: 'stored-hash',
        role: Role.STUDENT,
        organizationId: 'org-z',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
    });

    it('returns a JWT and organizationId when credentials are valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: 'stored-hash',
        role: Role.INSTRUCTOR,
        organizationId: 'org-99',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(input);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'stored-hash');
      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        role: Role.INSTRUCTOR,
        organizationId: 'org-99',
      });
      expect(result).toEqual({
        access_token: 'signed-token',
        organizationId: 'org-99',
      });
    });

    it('JWT payload includes organizationId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uid',
        passwordHash: 'h',
        role: Role.STUDENT,
        organizationId: 'org-payload',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({ email: 'e@e.com', password: 'password123' });

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-payload',
          sub: 'uid',
          role: Role.STUDENT,
        }),
      );
    });
  });
});
