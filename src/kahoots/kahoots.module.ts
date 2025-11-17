import { Module } from '@nestjs/common';
import { KahootsController } from './infrastructure/controllers/kahoots.controller';

@Module({
  controllers: [KahootsController],
  providers: [],
})
export class KahootsModule {}
