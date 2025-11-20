import { Module } from '@nestjs/common';
import { UsersController } from './infrastructure/nestJs/users.controller';

@Module({
  controllers: [UsersController],
  providers: [],
})
export class UsersModule {}
