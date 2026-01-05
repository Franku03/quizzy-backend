import { Module } from '@nestjs/common';
import { MultiplayerSessionsController, MultiplayerSessionsGateway, MultiplayerSessionsTracingService } from './infrastructure/nest-js';

import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { MediaModule } from 'src/media/infrastructure/nest-js/media.module';
import { CqrsModule } from '@nestjs/cqrs';

import { 
  CreateSessionHandler, 
  GetPinWithQrTokenHandler, 
  HostNextPhaseHandler, 
  HostStartGameHandler, 
  PlayerJoinHandler, 
  PlayerSubmitAnswerHandler, 
  SaveSessionHandler, 
  VerifyConnectionAvailabilityHandler,
  VerifyHostHandler,
  VerifyPinHandler
} from './application/commands';

import { InMemoryActiveSessionRepository } from './infrastructure/repositories/in-memory.session.repository';

import { UuidGenerator } from 'src/core/infrastructure/adapters/idgenerator/uuid-generator';
import { CryptoGeneratePinService } from './infrastructure/adapters/crypto-generate-pin';
import { FileSystemPinRepository } from './infrastructure/adapters/file-system.pin.repository';



@Module({
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot),
    RepositoryFactoryModule.forFeature(RepositoryName.MultiplayerSession),
    DaoFactoryModule.forFeature(DaoName.User), 
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

  ],
  controllers: [MultiplayerSessionsController],
})
export class MultiplayerSessionsModule {}
