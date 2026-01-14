/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\infrastructure\nest-js\kahoots.module.ts

import { Module } from '@nestjs/common';

// --- Controllers ---
import { KahootController } from './kahoots.controller';

// --- Capas de Datos (Factories & Enums) ---
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';

// --- Handlers (Commands & Queries) ---
import { CreateKahootHandler } from '../../application/commands/create-kahoot/create-kahoot.handler';
import { UpdateKahootHandler } from '../../application/commands/update-kahoot/update-kahoot.handler';
import { DeleteKahootHandler } from 'src/kahoots/application/commands/delete-kahoot/delete-kahoot.handler';
import { GetKahootByIdHandler } from '../../application/queries/get-kahoot-by-id/get-kahoot-by-id.handler';
import { GetKahootUserDetailHandler } from 'src/kahoots/application/queries/get-kahoot-preview-by-id/get-kahoot-user-detail-by-id.handler';

// --- Mappers & Tokens ---
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { KahootMapperService } from '../../application/mappers/kahoot.response.mapper';
import { CreateKahootRequestMapper } from '../adapters/mappers/create-kahoot.request.mapper';
import { UpdateKahootRequestMapper } from '../adapters/mappers/update-kahoot.request.mapper';

// --- Servicios de Apoyo & Otros Módulos ---
import { AttemptCleanupService } from '../../application/services/attempt-clear.service';
import { MediaModule } from 'src/media/infrastructure/nest-js/media.module';

@Module({
  controllers: [KahootController],
  imports: [
    // Registro dinámico de Repositorios y DAOs
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot),
    RepositoryFactoryModule.forFeature(RepositoryName.Attempt),
    DaoFactoryModule.forFeature(DaoName.Kahoot),
    MediaModule,
  ],
  providers: [
    // --- Handlers de Aplicación ---
    CreateKahootHandler,
    UpdateKahootHandler,
    DeleteKahootHandler,
    GetKahootByIdHandler,
    GetKahootUserDetailHandler,

    // --- Mapeo de Salida (Response) ---
    {
      provide: APPLICATION_CORE_TOKENS.MAPPER.RESPONSE_MAPPER,
      useClass: KahootMapperService,
    },

    // --- Mapeo de Entrada (Request to Command) ---
    {
      provide: APPLICATION_CORE_TOKENS.MAPPER.CREATE_KAHOOT_REQUEST,
      useClass: CreateKahootRequestMapper,
    },
    {
      provide: APPLICATION_CORE_TOKENS.MAPPER.UPDATE_KAHOOT_REQUEST,
      useClass: UpdateKahootRequestMapper,
    },

    AttemptCleanupService,
  ],
  exports: [],
})
export class KahootsModule {}
