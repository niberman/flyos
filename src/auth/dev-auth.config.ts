// ==========================================================================
// Dev auth bypass — shared rules for JwtAuthGuard and DevUserSeedService
// ==========================================================================

import { ConfigService } from '@nestjs/config';

export function isDevAuthBypassEnabled(config: ConfigService): boolean {
  if (config.get<string>('NODE_ENV') === 'production') {
    return false;
  }
  if (config.get<string>('FLYOS_STRICT_AUTH') === 'true') {
    return false;
  }
  if (config.get<string>('FLYOS_DEV_MODE') === 'false') {
    return false;
  }
  return true;
}
