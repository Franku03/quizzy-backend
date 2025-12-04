import { Module } from '@nestjs/common';
import { KahootsModule } from './kahoots/kahoots.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseDriverModule } from './database/infrastructure/database.driver.module';
import { MultiplayerSessionsModule } from './multiplayer-sessions/multiplayer-sessions.module';
import { SoloAttemptsModule } from './solo-attempts/solo-attempts.module';
import { CoreModule } from './core/core.module';
import { MediaModule } from './media/infraestructure/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseDriverModule.forRoot(),
    CoreModule,
    KahootsModule,
    UsersModule,
    MultiplayerSessionsModule,
    SoloAttemptsModule,
    MediaModule,
  ],
})
export class AppModule {
  constructor() {}
}
