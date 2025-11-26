import { Module } from '@nestjs/common';
import { SoloAttemptsController } from './nest-js/solo-attempts.controller';

@Module({
  controllers: [SoloAttemptsController]
})
export class SoloAttemptsModule {}
