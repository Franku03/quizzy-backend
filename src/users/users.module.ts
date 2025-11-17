import { Module } from '@nestjs/common';
import { UsersController } from './infrastructure/controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [],
})
export class UsersModule {}
