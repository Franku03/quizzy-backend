import { Module } from '@nestjs/common';
import { ReportsController } from './infrastructure/nest-js/reports.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

// Handlers
import { GetDetailedReportHandler } from './application/queries/get-solo-attempt-report/attempt.report.handler';

@Module({
  controllers: [ReportsController],
  imports: [
    DaoFactoryModule.forFeature(DaoName.SoloAttempt), // Carga de un DAO (para queries de CQRS)
    CqrsModule,
  ],
  providers: [
    // handlers
    GetDetailedReportHandler,
  ],
})
export class ReportsModule {}