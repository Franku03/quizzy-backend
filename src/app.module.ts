import { Module } from '@nestjs/common';
import { KahootsModule } from './kahoots/kahoots.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    KahootsModule,
    UsersModule,
  ],
})
export class AppModule {}
