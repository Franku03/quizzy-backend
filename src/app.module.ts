import { Module } from '@nestjs/common';
import { KahootsModule } from './kahoots/infrastructure/nest-js/kahoots.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseDriverModule } from './database/infrastructure/database.driver.module';
import { MultiplayerSessionsModule } from './multiplayer-sessions/multiplayer-sessions.module';
import { SoloAttemptsModule } from './solo-attempts/solo-attempts.module';
import { CoreModule } from './core/core.module';
import { LibraryModule } from './library/infrastructure/nestjs/library.module';
import { MediaModule } from './media/infrastructure/nest-js/media.module';
import { ReportsModule } from './reports/reports.module';
import { ExploreModule } from './explore/explore.module';
import { GroupsModule } from './groups/groups.module'; // De HEAD
import { AuthModule } from './auth/auth.module';
import { WellKnownController } from './shared/infrastructure/controllers/well-known.controller';
import { BackofficeModule } from './backoffice/infrastructure/nestjs/backoffice.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';


@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), 
      exclude: ['/api/(.*)'], 
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseDriverModule.forRoot(),
    CoreModule,
    KahootsModule,
    ReportsModule,
    UsersModule,
    MultiplayerSessionsModule,
    SoloAttemptsModule,
    LibraryModule,
    GroupsModule, 
    MediaModule,
    ExploreModule,
    AuthModule,
    BackofficeModule,
    NotificationsModule,
  ],
  controllers: [WellKnownController],
})
export class AppModule {
  constructor() {}
}
