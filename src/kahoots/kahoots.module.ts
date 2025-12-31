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

import { KahootMapperService } from './application/services/kahoot.mapper.service';
import { AttemptCleanupService } from './application/services/attempt-clear.service';
import { KahootAuthorizationService } from './application/services/kahoot-athorization.service';
import { MediaModule } from 'src/media/infraestructure/media.module';
import { KahootResponseService } from './application/services/kahoot-response.service';

import { KAHOOT_MEDIA_ENRICHER, KAHOOT_MEDIA_STRATEGY } from './application/dependency-tokkens/application-kahoot.tokens';
import { MediaEnricher } from './application/services/media-enricher.service';
import { KahootMediaStrategy } from './application/services/concrete-strategys/kahoot-media.strategy';
import { ASSET_URL_SERVICE } from 'src/media/application/dependecy-tokkens/application-media.tokens';
import { IAssetUrlGenerator } from 'src/media/application/ports/asset-url-generator.interface';

@Module({
  controllers: [KahootController],
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot),
    RepositoryFactoryModule.forFeature(RepositoryName.Attempt),
    DaoFactoryModule.forFeature(DaoName.Kahoot),
    MediaModule,
    CqrsModule,
  ],
  providers: [
    // --- Handlers ---
    CreateKahootHandler,
    UpdateKahootHandler,
    DeleteKahootHandler,
    GetKahootByIdHandler,

    // --- Services de Mapeo ---
    KahootResponseService,
    KahootMapperService,
    {
      provide: 'IKahootMapper',
      useClass: KahootMapperService,
    },
    {
      provide: KAHOOT_MEDIA_STRATEGY,
      useClass: KahootMediaStrategy,
    },

    {
      provide: KAHOOT_MEDIA_ENRICHER,
      useFactory: (assetService: IAssetUrlGenerator, strategy: KahootMediaStrategy) => {
        return new MediaEnricher(assetService, strategy);
      },
      inject: [ASSET_URL_SERVICE, KAHOOT_MEDIA_STRATEGY],
    },

    // --- Otros Servicios ---
    AttemptCleanupService,
    KahootAuthorizationService,
    KahootNestMapperAdapter,
  
  ],
  exports: [],
})
export class KahootsModule { }