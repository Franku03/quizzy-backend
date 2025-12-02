import { Module } from '@nestjs/common';
import { SoloAttemptsController } from './infrastructure/nest-js/solo-attempts.controller';

@Module({
  controllers: [SoloAttemptsController]
})
export class SoloAttemptsModule {}
