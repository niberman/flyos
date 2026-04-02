// ==========================================================================
// AuthService — Authentication Business Logic
// ==========================================================================
// This service handles the core authentication operations:
//
//   1. register(): Creates a new user with a bcrypt-hashed password.
//   2. login():    Validates credentials and issues a signed JWT.
//
// In the MVC pattern, this is the business logic layer that sits between
// the Controller (AuthResolver) and the Model (PrismaService). It contains
// no HTTP/GraphQL-specific code — it simply processes data and returns results.
//
// Security Considerations:
//   - Passwords are hashed with bcrypt (10 salt rounds) before storage.
//   - The JWT payload contains only the user ID and role — never the password.
//   - Login returns a generic error for both "user not found" and "wrong
//     password" to prevent user enumeration attacks.
// ==========================================================================

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new user in the system.
   *
   * Data Flow:
   *   1. Receive email, password, and optional role from the resolver.
   *   2. Hash the password using bcrypt with 10 salt rounds.
   *   3. Persist the new user via PrismaService (Model layer).
   *   4. Generate and return a JWT for immediate authentication.
   *
   * @param input - RegisterInput DTO containing email, password, and role.
   * @returns An object containing the access_token JWT string.
   * @throws ConflictException if the email is already registered.
   */
  async register(input: RegisterInput) {
    // Check for duplicate email before attempting insertion.
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    // Hash the plaintext password. The salt rounds parameter (10) determines
    // the computational cost — higher is more secure but slower.
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Persist the user to PostgreSQL via Prisma (Model layer).
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role,
        organizationId: input.organizationId,
      },
    });

    // Sign a JWT containing the user's ID and role for subsequent requests.
    const payload = { sub: user.id, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  /**
   * Authenticates a user and returns a signed JWT.
   *
   * Data Flow:
   *   1. Look up the user by email via PrismaService.
   *   2. Compare the provided password against the stored bcrypt hash.
   *   3. If valid, sign and return a JWT; otherwise, throw 401.
   *
   * @param input - LoginInput DTO containing email and password.
   * @returns An object containing the access_token JWT string.
   * @throws UnauthorizedException if credentials are invalid.
   */
  async login(input: LoginInput) {
    // Query the Model layer (PrismaService) for the user record.
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    // Use a generic message for both "not found" and "wrong password"
    // to prevent user enumeration attacks.
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // bcrypt.compare hashes the input and compares against the stored hash.
    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // The JWT payload identifies the user and their role for RBAC checks.
    const payload = { sub: user.id, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }
}
