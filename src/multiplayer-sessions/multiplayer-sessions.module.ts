/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\multiplayer-sessions.module.ts

import { Module } from '@nestjs/common';
import { MultiplayerSessionsController, MultiplayerSessionsGateway, MultiplayerSessionsTracingService } from './infrastructure/nest-js';

import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { MediaModule } from 'src/media/infrastructure/nest-js/media.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { CqrsModule } from '@nestjs/cqrs';

import { 
  CreateSessionHandler, 
  DeleteSessionHandler, 
  GetPinWithQrTokenHandler, 
  HostNextPhaseHandler, 
  HostStartGameHandler, 
  PlayerJoinHandler, 
  PlayerSubmitAnswerHandler, 
  SaveSessionHandler, 
  SyncStateHandler, 
  VerifyConnectionAvailabilityHandler,
  VerifyHostHandler,
  VerifyPinHandler
} from './application/commands';

import { 
  CryptoGeneratePinService, 
  FileSystemPinRepository, 
  InMemoryActiveSessionRepository, 
  MutexSessionConcurrencyManager 
} from './infrastructure/adapters';

import { AuthModule } from 'src/auth/auth.module';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import { CryptoGeneratePinServiceErrorMapper } from './infrastructure/errors/crypto-generate-pin.error.mapper';
import { FileSystemPinRepositoryErrorMapper } from './infrastructure/errors/file-system-pin-repository.error.mapper';
import { InMemoryActiveSessionRepositoryErrorMapper } from './infrastructure/errors/in-memory-session-respository.error.mapper';



@Module({
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot),
    RepositoryFactoryModule.forFeature(RepositoryName.MultiplayerSession),
    DaoFactoryModule.forFeature(DaoName.User), 
    AuthModule,
    MediaModule,
    CqrsModule,
  ],
  providers: [
    MultiplayerSessionsGateway, 
    MultiplayerSessionsTracingService,

    //Commands
    CreateSessionHandler,
    GetPinWithQrTokenHandler,
    PlayerJoinHandler,
    HostStartGameHandler,
    PlayerSubmitAnswerHandler,
    HostNextPhaseHandler,
    SaveSessionHandler,
    VerifyConnectionAvailabilityHandler,
    VerifyHostHandler,
    VerifyPinHandler,
    SyncStateHandler,
    DeleteSessionHandler,

    // Injectables - servicios y repos¨
    {
      provide: APPLICATION_CORE_TOKENS.UTILS.PIN_GENERATOR_SERVICE,
      useClass: CryptoGeneratePinService
    },
    {
      provide: APPLICATION_CORE_TOKENS.UTILS.ACTIVE_SESSION_REPO,
      useClass: InMemoryActiveSessionRepository
    },
    {
      provide: APPLICATION_CORE_TOKENS.UTILS.PIN_REPO,
      useClass: FileSystemPinRepository
    },
    {
      provide: APPLICATION_CORE_TOKENS.UTILS.CONCURRENCY_MANAGER,
      useClass: MutexSessionConcurrencyManager
    },

    // Mappers de erroers
    {
      provide: ERROR_TOKENS.MAPPERS.CRYPTO,
      useClass: CryptoGeneratePinServiceErrorMapper
    },
    {
      provide: ERROR_TOKENS.MAPPERS.FILESYSTEM,
      useClass: FileSystemPinRepositoryErrorMapper
    },
    {
      provide: ERROR_TOKENS.MAPPERS.MEMORY,
      useClass: InMemoryActiveSessionRepositoryErrorMapper
    },
  ],
  controllers: [MultiplayerSessionsController],
})
export class MultiplayerSessionsModule {}
