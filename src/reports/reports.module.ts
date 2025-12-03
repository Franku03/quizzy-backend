import { Module } from '@nestjs/common';
import { ReportsController } from './infrastructure/nest-js/reports.controller';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { CqrsModule } from '@nestjs/cqrs';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

// Handlers


@Module({
  controllers: [ReportsController],
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.Attempt), // carga de repositorio (para commands de CQRS)
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot),
    DaoFactoryModule.forFeature(DaoName.SoloAttempt), // Carga de un DAO (para queries de CQRS)
    CqrsModule,
  ],
  providers: [
    // handlers

  ],
})
export class ReportsModule {}