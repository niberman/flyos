// ==========================================================================
// isDevAuthBypassEnabled — Unit Tests
// ==========================================================================
// Verifies the three conditions under which dev auth bypass is disabled:
//   1. NODE_ENV === 'production'
//   2. FLYOS_STRICT_AUTH === 'true'
//   3. FLYOS_DEV_MODE === 'false'
// ==========================================================================

import { ConfigService } from '@nestjs/config';
import { isDevAuthBypassEnabled } from './dev-auth.config';

/** Helper to create a ConfigService mock that returns values from a map. */
function buildConfig(
  values: Record<string, string | undefined>,
): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('isDevAuthBypassEnabled', () => {
  it('returns true in default dev environment (no overrides)', () => {
    const config = buildConfig({});
    expect(isDevAuthBypassEnabled(config)).toBe(true);
  });

  it('returns false when NODE_ENV is production', () => {
    const config = buildConfig({ NODE_ENV: 'production' });
    expect(isDevAuthBypassEnabled(config)).toBe(false);
  });

  it('returns true when NODE_ENV is development', () => {
    const config = buildConfig({ NODE_ENV: 'development' });
    expect(isDevAuthBypassEnabled(config)).toBe(true);
  });

  it('returns false when FLYOS_STRICT_AUTH is true', () => {
    const config = buildConfig({ FLYOS_STRICT_AUTH: 'true' });
    expect(isDevAuthBypassEnabled(config)).toBe(false);
  });

  it('returns true when FLYOS_STRICT_AUTH is false', () => {
    const config = buildConfig({ FLYOS_STRICT_AUTH: 'false' });
    expect(isDevAuthBypassEnabled(config)).toBe(true);
  });

  it('returns false when FLYOS_DEV_MODE is false', () => {
    const config = buildConfig({ FLYOS_DEV_MODE: 'false' });
    expect(isDevAuthBypassEnabled(config)).toBe(false);
  });

  it('returns true when FLYOS_DEV_MODE is true', () => {
    const config = buildConfig({ FLYOS_DEV_MODE: 'true' });
    expect(isDevAuthBypassEnabled(config)).toBe(true);
  });

  it('returns false when production even if DEV_MODE is true', () => {
    // Production takes precedence over all other flags.
    const config = buildConfig({
      NODE_ENV: 'production',
      FLYOS_DEV_MODE: 'true',
    });
    expect(isDevAuthBypassEnabled(config)).toBe(false);
  });

  it('returns false when STRICT_AUTH is true even if DEV_MODE is true', () => {
    const config = buildConfig({
      FLYOS_STRICT_AUTH: 'true',
      FLYOS_DEV_MODE: 'true',
    });
    expect(isDevAuthBypassEnabled(config)).toBe(false);
  });
});
