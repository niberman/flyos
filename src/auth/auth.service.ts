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
//   - The JWT payload contains only the user ID, role, and organizationId.
//   - Login returns a generic error for both "user not found" and "wrong
//     password" to prevent user enumeration attacks.
// ==========================================================================

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
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

  private slugifyOrganizationName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  private async ensureUniqueOrganizationSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let n = 0;
    while (
      await this.prisma.organization.findUnique({ where: { slug } })
    ) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }
    return slug;
  }

  /**
   * Registers a new user in the system.
   *
   * Organization resolution:
   *   - organizationId: join existing org (requires at least one base).
   *   - organizationName (and no organizationId): create org + default base.
   *   - neither: BadRequestException.
   *
   * @param input - RegisterInput DTO containing email, password, role, and org fields.
   * @returns access_token and organizationId.
   * @throws ConflictException if the email is already registered.
   */
  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    let organizationId: string;
    let defaultBaseId: string;

    if (input.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: input.organizationId },
        include: {
          bases: { take: 1, orderBy: { createdAt: 'asc' } },
        },
      });
      if (!org) {
        throw new BadRequestException('Organization not found');
      }
      const base = org.bases[0];
      if (!base) {
        throw new BadRequestException(
          'Organization has no base. Add a base before inviting users.',
        );
      }
      organizationId = org.id;
      defaultBaseId = base.id;
    } else if (input.organizationName?.trim()) {
      const name = input.organizationName.trim();
      const baseSlug = this.slugifyOrganizationName(name);
      const slug = await this.ensureUniqueOrganizationSlug(baseSlug);

      const created = await this.prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: { name, slug },
        });
        const base = await tx.base.create({
          data: {
            organizationId: org.id,
            name: 'Main Base',
            icaoCode: 'XXXX',
            timezone: 'UTC',
          },
        });
        const user = await tx.user.create({
          data: {
            email: input.email,
            passwordHash,
            role: input.role ?? undefined,
            organizationId: org.id,
          },
        });
        await tx.userBase.create({
          data: { userId: user.id, baseId: base.id },
        });
        return { user, organizationId: org.id };
      });

      const payload = {
        sub: created.user.id,
        role: created.user.role,
        organizationId: created.organizationId,
      };
      return {
        access_token: this.jwtService.sign(payload),
        organizationId: created.organizationId,
      };
    } else {
      throw new BadRequestException('Organization is required');
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role ?? undefined,
        organizationId,
      },
    });

    await this.prisma.userBase.create({
      data: { userId: user.id, baseId: defaultBaseId },
    });

    const payload = {
      sub: user.id,
      role: user.role,
      organizationId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      organizationId,
    };
  }

  /**
   * Authenticates a user and returns a signed JWT.
   *
   * @param input - LoginInput DTO containing email and password.
   * @returns access_token and organizationId.
   * @throws UnauthorizedException if credentials are invalid.
   */
  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = {
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      organizationId: user.organizationId,
    };
  }
}
