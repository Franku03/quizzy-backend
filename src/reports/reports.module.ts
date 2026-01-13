import { Module } from '@nestjs/common';
import { ReportsController } from './infrastructure/nest-js/reports.controller';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { MediaModule } from 'src/media/infrastructure/nest-js/media.module';
import {
   GetDetailedHostReportHandler, 
   GetDetailedPlayerReportHandler, 
   GetDetailedReportHandler, 
   GetPlayedKahootListHandler 
} from './application';

// Handlers

@Module({
  controllers: [ReportsController],
  imports: [
    DaoFactoryModule.forFeature(DaoName.SoloAttempt), // Carga de un DAO (para queries de CQRS)
    DaoFactoryModule.forFeature(DaoName.MultiplayerSession),
    MediaModule,
  ],
  providers: [
    // handlers
    GetDetailedReportHandler,
    GetDetailedHostReportHandler,
    GetDetailedPlayerReportHandler,
    GetPlayedKahootListHandler,
  ],
})
export class ReportsModule {}