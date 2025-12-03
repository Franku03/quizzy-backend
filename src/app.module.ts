import { Module } from '@nestjs/common';
import { KahootsModule } from './kahoots/kahoots.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseDriverModule } from './database/infrastructure/database.driver.module';
import { MultiplayerSessionsModule } from './multiplayer-sessions/multiplayer-sessions.module';
<<<<<<< HEAD
import { SoloAttemptsModule } from './solo-attempts/infrastructure/solo-attempts.module';
import { GroupsModule } from './groups/groups.module';
=======
import { SoloAttemptsModule } from './solo-attempts/solo-attempts.module';
import { CoreModule } from './core/core.module';
>>>>>>> origin/develop

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
    GroupsModule,
  ],
})
export class AppModule {
  constructor() { }
}
