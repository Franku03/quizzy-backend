import { Module } from '@nestjs/common';
import { KahootsController } from './infrastructure/nest-js/kahoots.controller';

@Module({
  controllers: [KahootsController],
  providers: [],
})
export class KahootsModule {}
