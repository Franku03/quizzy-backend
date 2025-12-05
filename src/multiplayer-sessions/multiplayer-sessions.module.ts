import { Module } from '@nestjs/common';
import { MultiplayerSessionsController, MultiplayerSessionsGateway, MultiplayerSessionsService } from './infrastructure/nest-js';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateSessionHandler, GetPinWithQrTokenHandler } from './application/commands';
import { InMemorySessionRepository } from './infrastructure/repositories/in-memory.session.repository';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';
import { CryptoGeneratePinService } from './infrastructure/adapters/crypto-generate-pin';
import { FileSystemPinRepository } from './infrastructure/adapters/file-system.pin.repository';
import { JoinPlayerHandler } from './application/commands/join-player/join-player.handler';
import { HostStartGameHandler } from './application/commands/host-start-game/host-start-game.handler';
import { PlayerSubmitAnswerHandler } from './application/commands/player-submit-answer/player-submit-answer.handler';


@Module({
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot), // carga de repositorio (para commands de CQRS)
    // DaoFactoryModule.forFeature(DaoName.User), // Carga de un DAO (para queries de CQRS)
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
  ],
  controllers: [MultiplayerSessionsController],
})
export class MultiplayerSessionsModule {}
