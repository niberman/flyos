import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn(),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {}
    $connect = jest.fn();
    $disconnect = jest.fn();
  },
}));

function buildConfigService(url?: string): ConfigService {
  return { get: jest.fn().mockReturnValue(url) } as unknown as ConfigService;
}

describe('PrismaService', () => {
  it('throws when DATABASE_URL is missing', () => {
    expect(() => new PrismaService(buildConfigService(undefined))).toThrow(
      'DATABASE_URL is missing or empty',
    );
  });

  it('throws when DATABASE_URL is empty string', () => {
    expect(() => new PrismaService(buildConfigService('  '))).toThrow(
      'DATABASE_URL is missing or empty',
    );
  });

  it('constructs successfully with a valid DATABASE_URL', () => {
    expect(
      () =>
        new PrismaService(buildConfigService('postgresql://localhost/test')),
    ).not.toThrow();
  });

  it('connects on module init', async () => {
    const service = new PrismaService(
      buildConfigService('postgresql://localhost/test'),
    );
    await service.onModuleInit();
    expect(service.$connect).toHaveBeenCalled();
  });

  it('disconnects on module destroy', async () => {
    const service = new PrismaService(
      buildConfigService('postgresql://localhost/test'),
    );
    await service.onModuleDestroy();
    expect(service.$disconnect).toHaveBeenCalled();
  });
});
