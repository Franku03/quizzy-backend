// src/kahoots/kahoots.module.ts
import { Module } from '@nestjs/common';
import { KahootController } from './infrastructure/nest-js/kahoots.controller';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateKahootHandler } from './application/commands/create-kahoot/create-kahoothandler';
import { KahootNestMapperAdapter } from 'src/kahoots/infrastructure/adapters/mappers/kahoot.request.mapper'; 
import { UpdateKahootHandler } from './application/commands/update-kahoot/update-kahoothandler';
import { DeleteKahootHandler } from './application/commands/delete-kahoot/delete-kahoothandler';
import { GetKahootByIdHandler } from './application/queries/get-kahoot-by-id/get-kahoot-by-id.handler';

import { CommandQueryExecutorService } from './infrastructure/nest-js/command-query-executor.service';
import { KahootMapperService } from './application/services/kahoot.mapper.service';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';
import { AttemptCleanupService } from './application/services/attempt-clear.service';
import { KahootAuthorizationService } from './application/services/kahoot-athorization.service';
import { KahootAssetEnricherService } from './application/services/kahoot-asset-enricher.service';
import { MediaModule } from 'src/media/infraestructure/media.module';
import { KahootResponseService } from './application/services/kahoot-response.service';

@Module({
  controllers: [KahootController],
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot),
    RepositoryFactoryModule.forFeature(RepositoryName.Attempt),
    DaoFactoryModule.forFeature(DaoName.Kahoot),
    
    MediaModule, // <--- ¡IMPORTA EL MÓDULO MEDIA! Ahora KahootsModule conoce sus exports.
    
    CqrsModule,
  ],
  providers: [
    // Handlers
    CreateKahootHandler,
    UpdateKahootHandler,
    DeleteKahootHandler,
    GetKahootByIdHandler,
    
    // Services
    CommandQueryExecutorService,
    KahootMapperService,
    {
      provide: 'IKahootMapper',  
      useClass: KahootMapperService,  
    },
    
    KahootResponseService, 
    AttemptCleanupService,
    KahootAuthorizationService,
    KahootAssetEnricherService,
    
    // Otros
    KahootNestMapperAdapter,
    UuidGenerator,
  ],
  exports: [
    CommandQueryExecutorService,
  ],
})
export class KahootsModule {}