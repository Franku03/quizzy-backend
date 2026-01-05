import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { KahootController } from './kahoots.controller';

// Capas de Datos
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';

// Handlers
import { CreateKahootHandler } from '../../application/commands/create-kahoot/create-kahoot.handler';
import { UpdateKahootHandler } from '../../application/commands/update-kahoot/update-kahoot.handler';
import { DeleteKahootHandler } from 'src/kahoots/application/commands/delete-kahoot/delete-kahoot.handler';
import { GetKahootByIdHandler } from '../../application/queries/get-kahoot-by-id/get-kahoot-by-id.handler';

// Mappers & Helpers
import { MAPPER_TOKEN } from 'src/core/application/mapper/i-mapper.token';
import { KahootMapperService } from '../../application/mappers/kahoot.response.mapper';
import { CreateKahootRequestMapper } from '../adapters/mappers/create-kahoot.request.mapper';
import { UpdateKahootRequestMapper } from '../adapters/mappers/update-kahoot.request.mapper';

// Otros Servicios e Infraestructura
import { AttemptCleanupService } from '../../application/services/attempt-clear.service';
import { MediaModule } from 'src/media/infrastructure/nest-js/media.module';

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
    // --- Comandos y Consultas (Handlers) ---
    CreateKahootHandler,
    UpdateKahootHandler,
    DeleteKahootHandler,
    GetKahootByIdHandler,

    // --- Mapeo de Salida (Usa Token para el Handler) ---
    {
      provide: MAPPER_TOKEN,
      useClass: KahootMapperService,
    },

    // --- Mapeo de Entrada (Inyección Directa para el Controller) ---
    CreateKahootRequestMapper,
    UpdateKahootRequestMapper,

    // --- Servicios de Aplicación y Apoyo ---
    AttemptCleanupService,
  ],
  exports: [],
})
export class KahootsModule { }