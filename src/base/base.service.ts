import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';

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
}
