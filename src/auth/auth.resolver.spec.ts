// ==========================================================================
// AuthResolver — Unit Tests
// ==========================================================================
// Tests the GraphQL controller for authentication. Verifies that the
// resolver correctly delegates to AuthService and returns responses.
// ==========================================================================

import { Test } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();
    resolver = module.get(AuthResolver);
  });

  describe('register', () => {
    it('delegates to AuthService.register and returns the result', async () => {
      const input = {
        email: 'new@flyos.com',
        password: 'securepass',
        role: Role.STUDENT,
        organizationName: 'Test Org',
      };
      const expected = {
        access_token: 'jwt-token',
        organizationId: 'org-1',
      };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await resolver.register(input);

      expect(result).toEqual(expected);
      expect(mockAuthService.register).toHaveBeenCalledWith(input);
    });

    it('passes through errors from AuthService', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Conflict'));

      await expect(
        resolver.register({
          email: 'dup@flyos.com',
          password: 'password1',
          organizationId: 'org-1',
        }),
      ).rejects.toThrow('Conflict');
    });
  });

  describe('login', () => {
    it('delegates to AuthService.login and returns the result', async () => {
      const input = { email: 'user@flyos.com', password: 'password1' };
      const expected = {
        access_token: 'jwt-login-token',
        organizationId: 'org-2',
      };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await resolver.login(input);

      expect(result).toEqual(expected);
      expect(mockAuthService.login).toHaveBeenCalledWith(input);
    });

    it('passes through UnauthorizedException from AuthService', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        resolver.login({ email: 'bad@flyos.com', password: 'wrong' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
