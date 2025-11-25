import { Module } from '@nestjs/common';
import { KahootsModule } from './kahoots/kahoots.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseDriverModule } from './database/infrastructure/database.driver.module';
import { MultiplayerSessionsModule } from './multiplayer-sessions/multiplayer-sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseDriverModule.forRoot(),
    KahootsModule,
    UsersModule,
    MultiplayerSessionsModule,
  ],
})
export class AppModule {
  constructor() {}
}
