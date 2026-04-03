import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';
import { CreateBaseInput } from './dto/create-base.input';

@Injectable()
export class BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private requireOrganizationId(): string {
    const organizationId = this.tenantContext.organizationId;
    if (!organizationId) {
      throw new UnauthorizedException('Missing organization context.');
    }
    return organizationId;
  }

  async findAll() {
    const organizationId = this.requireOrganizationId();
    return this.prisma.base.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const organizationId = this.requireOrganizationId();
    return this.prisma.base.findFirst({
      where: { id, organizationId },
    });
  }

  async create(input: CreateBaseInput) {
    const organizationId = this.requireOrganizationId();
    const icaoCode = input.icaoCode.trim().toUpperCase();

    const duplicate = await this.prisma.base.findFirst({
      where: { organizationId, icaoCode },
    });
    if (duplicate) {
      throw new ConflictException(
        `A base with ICAO code ${icaoCode} already exists in your organization.`,
      );
    }

    return this.prisma.base.create({
      data: {
        organizationId,
        name: input.name.trim(),
        icaoCode,
        timezone: input.timezone.trim(),
      },
    });
  }
}
