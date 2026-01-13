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


import { UuidGenerator } from 'src/core/infrastructure/adapters/idgenerator/uuid-generator';
import { 
  CryptoGeneratePinService, 
  FileSystemPinRepository, 
  InMemoryActiveSessionRepository, 
  MutexSessionConcurrencyManager 
} from './infrastructure/adapters';

import { AuthModule } from 'src/auth/auth.module';



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
    // Injectables
    InMemoryActiveSessionRepository,
    CryptoGeneratePinService,
    FileSystemPinRepository,
    UuidGenerator,
    MutexSessionConcurrencyManager,
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
    DeleteSessionHandler

  ],
  controllers: [MultiplayerSessionsController],
})
export class MultiplayerSessionsModule {}
