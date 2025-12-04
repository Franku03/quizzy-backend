import { Module } from '@nestjs/common';
import { ExploreController } from './infrastructure/nestjs/explore.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

// Handlers

@Module({
  controllers: [ExploreController],
  imports: [
    DaoFactoryModule.forFeature(DaoName.SoloAttempt), // Carga de un DAO (para queries de CQRS)
    CqrsModule,
  ],
  providers: [
    // handlers
    
  ],
})
export class ExploreModule {}