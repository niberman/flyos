// ==========================================================================
// AuthResolver — GraphQL Controller for Authentication
// ==========================================================================
// In the MVC pattern, this resolver acts as the **Controller**. It:
//   1. Receives incoming GraphQL mutations (the "View" layer's requests).
//   2. Validates input using class-validator decorators on the DTO classes.
//   3. Delegates business logic to AuthService.
//   4. Returns the result to the client as a GraphQL response (View).
//
// The resolver does NOT contain business logic — it simply routes requests
// to the appropriate service method. This separation of concerns makes the
// code testable and maintainable.
//
// Data Flow:
//   Client → GraphQL Mutation → AuthResolver (Controller) →
//   AuthService (Business Logic) → PrismaService (Model) → PostgreSQL
// ==========================================================================

import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response.type';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  /**
   * Mutation: register
   * Creates a new user account and returns a JWT for immediate use.
   *
   * Example GraphQL mutation:
   *   mutation {
   *     register(input: { email: "pilot@flyos.com", password: "secure123", role: STUDENT }) {
   *       access_token
   *     }
   *   }
   */
  @Mutation(() => AuthResponse, {
    description: 'Register a new user and receive a JWT access token.',
  })
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    return this.authService.register(input);
  }

  /**
   * Mutation: login
   * Authenticates a user with email/password and returns a JWT.
   *
   * Example GraphQL mutation:
   *   mutation {
   *     login(input: { email: "pilot@flyos.com", password: "secure123" }) {
   *       access_token
   *     }
   *   }
   */
  @Mutation(() => AuthResponse, {
    description: 'Authenticate with email and password to receive a JWT.',
  })
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    return this.authService.login(input);
  }
}
