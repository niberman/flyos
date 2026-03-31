// ==========================================================================
// JwtStrategy — Passport JWT Validation Strategy
// ==========================================================================
// This strategy is invoked automatically by the JwtAuthGuard whenever a
// protected route or resolver is accessed. It:
//
//   1. Extracts the JWT from the Authorization header (Bearer scheme).
//   2. Verifies the token signature using the JWT_SECRET.
//   3. Decodes the payload and attaches { userId, role } to the request.
//
// In the MVC pattern, this strategy is part of the Controller middleware
// pipeline. It runs before the resolver, ensuring that only authenticated
// users can access protected operations.
//
// Data Flow:
//   Incoming Request → Extract Bearer Token → Verify Signature →
//   Decode Payload → Attach to request.user → Resolver executes
// ==========================================================================

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JwtPayload represents the decoded contents of the JWT.
 * - sub: The user's UUID (subject claim per JWT spec).
 * - role: The user's role (STUDENT, INSTRUCTOR, or DISPATCHER).
 */
interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Extract the JWT from the Authorization: Bearer <token> header.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Reject expired tokens automatically.
      ignoreExpiration: false,

      // Use the same secret that was used to sign the token.
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  /**
   * validate() is called by Passport after the token is verified.
   * The return value is attached to the request object as `request.user`.
   *
   * @param payload - The decoded JWT payload.
   * @returns An object with userId and role, available in resolvers.
   */
  async validate(payload: JwtPayload) {
    return { userId: payload.sub, role: payload.role };
  }
}
