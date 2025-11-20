import { Module } from '@nestjs/common';
import { KahootsController } from './infrastructure/nestJs/kahoots.controller';

@Module({
  controllers: [KahootsController],
  providers: [],
})
export class KahootsModule {}
