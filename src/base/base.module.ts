import { Module } from '@nestjs/common';
import { BaseService } from './base.service';
import { BaseResolver } from './base.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantModule } from '../prisma/tenant.module';

@Module({
  imports: [PrismaModule, TenantModule],
  providers: [BaseService, BaseResolver],
  exports: [BaseService],
})
export class BaseModule {}
