import { Module } from '@nestjs/common';
import { MultiplayerSessionsController, MultiplayerSessionsGateway, MultiplayerSessionsService } from './infrastructure/nest-js';

import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { CqrsModule } from '@nestjs/cqrs';

import { 
  CreateSessionHandler, 
  GetPinWithQrTokenHandler, 
  HostNextPhaseHandler, 
  HostStartGameHandler, 
  JoinPlayerHandler, 
  PlayerSubmitAnswerHandler, 
  SaveSessionHandler 
} from './application/commands';

import { InMemorySessionRepository } from './infrastructure/repositories/in-memory.session.repository';
import { UuidGenerator } from 'src/core/infrastructure/adapters/idgenerator/uuid-generator';
import { CryptoGeneratePinService } from './infrastructure/adapters/crypto-generate-pin';
import { FileSystemPinRepository } from './infrastructure/adapters/file-system.pin.repository';



@Module({
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot),
    RepositoryFactoryModule.forFeature(RepositoryName.MultiplayerSession),
    CqrsModule,
  ],
  providers: [
    MultiplayerSessionsGateway, 
    MultiplayerSessionsService,
    // Injectables
    InMemorySessionRepository,
    CryptoGeneratePinService,
    FileSystemPinRepository,
    UuidGenerator,
    //Commands
    CreateSessionHandler,
    GetPinWithQrTokenHandler,
    JoinPlayerHandler,
    HostStartGameHandler,
    PlayerSubmitAnswerHandler,
    HostNextPhaseHandler,
    SaveSessionHandler,
  ],
  controllers: [MultiplayerSessionsController],
})
export class MultiplayerSessionsModule {}
