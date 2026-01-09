import { Module } from '@nestjs/common';
import { BackofficeController } from './backoffice.controller';

@Module({
  controllers: [BackofficeController],
  providers: [],
})
export class BackofficeModule {}
