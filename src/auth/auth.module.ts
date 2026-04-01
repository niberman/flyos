// ==========================================================================
// AuthModule — Authentication & Authorization Module
// ==========================================================================
// This module encapsulates all authentication and authorization concerns:
//
//   1. JWT Token Issuance:  AuthService generates signed JWTs upon login.
//   2. JWT Token Validation: JwtStrategy validates tokens on incoming requests.
//   3. Role-Based Access:   RolesGuard checks the user's role against the
//                           required roles defined by @Roles() decorators.
//
// MVC Pattern Role:
//   This module acts as middleware between the View (GraphQL API) and the
//   Controller (Resolvers). Guards intercept requests before they reach
//   the resolver, enforcing authentication and authorization policies.
//
// Data Flow for Authentication:
//   Login Mutation → AuthResolver → AuthService → PrismaService (verify
//   credentials) → JWT signed and returned to client.
//
// Data Flow for Protected Operations:
//   Request with Bearer Token → JwtAuthGuard (validates token) →
//   RolesGuard (checks role) → Resolver (processes request).
// ==========================================================================

import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { DevUserSeedService } from './dev-user-seed.service';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JwtModule is configured asynchronously to read the JWT_SECRET from
    // environment variables via ConfigService. The token expires in 24 hours.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    DevUserSeedService,
  ],
  exports: [AuthService, JwtModule, PassportModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
