import { Module } from '@nestjs/common';
import { MultiplayerSessionsController, MultiplayerSessionsGateway, MultiplayerSessionsService } from './infrastructure/nest-js';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot), // carga de repositorio (para commands de CQRS)
    // DaoFactoryModule.forFeature(DaoName.User), // Carga de un DAO (para queries de CQRS)
    CqrsModule,
  ],
  providers: [
    MultiplayerSessionsGateway, 
    MultiplayerSessionsService,
  ],
  controllers: [MultiplayerSessionsController],
})
export class MultiplayerSessionsModule {}
