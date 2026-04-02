import { Module } from '@nestjs/common';
import { SquawkService } from './squawk.service';
import { SquawkResolver } from './squawk.resolver';

@Module({
  providers: [SquawkService, SquawkResolver],
  exports: [SquawkService],
})
export class SquawkModule {}
