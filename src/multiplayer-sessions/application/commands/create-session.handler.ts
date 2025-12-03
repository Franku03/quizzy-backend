import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateSessionCommand } from "./create-session.command";

import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { InMemorySessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/InMemorySessionRepository";

import type { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
import type { IGeneratePinService } from "src/multiplayer-sessions/domain/domain-services";
import type { IdGenerator } from "src/core/application/idgenerator/id.generator";

import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { MultiplayerSessionFactory } from "src/multiplayer-sessions/domain/factories/multiplayer-session.factory";
import { UuidGenerator } from "src/core/infrastructure/event-buses/idgenerator/uuid-generator";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { CryptoGeneratePinService } from "src/multiplayer-sessions/infrastructure/adapters/crypto-generate-pin";
import { SlideId } from '../../../core/domain/shared-value-objects/id-objects/kahoot.slide.id';
import { MultiplayerSessionId } from "src/core/domain/shared-value-objects/id-objects/multiplayer-session.id";


@CommandHandler( CreateSessionCommand )
export class CreateSessionHandler implements ICommandHandler<CreateSessionCommand> {

    constructor(
        @Inject( InMemorySessionRepository )
        private readonly sessionRepository: InMemorySessionRepository,

        @Inject( RepositoryName.Kahoot )
        private readonly kahootRepository: IKahootRepository,

        @Inject( UuidGenerator )
        private readonly IdGenerator: IdGenerator<string>,

        @Inject( CryptoGeneratePinService)
        private readonly sessionPinGenerator: IGeneratePinService
    ){}

    async execute(command: CreateSessionCommand): Promise<void> {

        // Cargamos el agregado kahoot desde el repositorio
        const tempKahootId = new KahootId( command.kahootId );

        const kahootOpt = await this.kahootRepository.findKahootById( tempKahootId );

        if( !kahootOpt.hasValue() )
            throw new Error("El Kahoot solicitado no existe");

        const kahoot = kahootOpt.getValue()

        const slideId = new SlideId( kahoot.getNextSlideSnapshotByIndex()?.id! )

        const kahootInfo = {
            kahootId: kahoot.id,
            firstSlideId: slideId,
            slidesNumber: kahoot.hasHowManySlides(), // ! Algo me dice que hay un problema con el numero de slidesTotales y el progreso
        }

        // Creamos el id de la sesion y reconstruimos el VO del id del user host
        const sessionIdString = await this.IdGenerator.generateId();
        const sessionId = new MultiplayerSessionId( sessionIdString );

        const hostId = new UserId( command.hostId );

        // Generamos el Pin de la sesion
        const pin = await this.sessionPinGenerator.generateUniquePin();

        const session = MultiplayerSessionFactory.createMultiplayerSession(
            kahootInfo,
            hostId,
            sessionId,
            pin
        )

        await this.sessionRepository.save({
            session,
            kahoot,
            lastActivity: 0 // Luego se actualizara al guardarse
        });

    }

}