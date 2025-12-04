import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { Inject } from "@nestjs/common";
import { InMemorySessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import { JoinPlayerCommand } from "./join-player.command";

import type { IGeneratePinService } from "src/multiplayer-sessions/domain/domain-services";
import type { IdGenerator } from "src/core/application/idgenerator/id.generator";

import { MultiplayerSessionFactory } from "src/multiplayer-sessions/domain/factories/multiplayer-session.factory";
import { UuidGenerator } from "src/core/infrastructure/event-buses/idgenerator/uuid-generator";
import { CryptoGeneratePinService } from "src/multiplayer-sessions/infrastructure/adapters/crypto-generate-pin";
import { MultiplayerSessionId } from "src/core/domain/shared-value-objects/id-objects/multiplayer-session.id";
import { Either } from '../../../../core/types/either';
import { COMMON_ERRORS } from "../common.errors";
import { PlayerFactory } from "src/multiplayer-sessions/domain/factories/player.factory";
import { PlayerId } from "src/multiplayer-sessions/domain/value-objects";



@CommandHandler( JoinPlayerCommand )
export class CreateSessionHandler implements ICommandHandler<JoinPlayerCommand> {

    constructor(
        @Inject( InMemorySessionRepository )
        private readonly sessionRepository: InMemorySessionRepository,

        @Inject( UuidGenerator )
        private readonly IdGenerator: IdGenerator<string>,

        @Inject( CryptoGeneratePinService)
        private readonly sessionPinGenerator: IGeneratePinService
    ){}

    async execute(command: JoinPlayerCommand): Promise<Either<Error, boolean>> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

            const { session } = sessionWrapper

            // TODO: Aqui habria que verificar si el id del jugador corresponde a algun usuario, habria que inyectar el repo de users

            const playerId = new PlayerId( command.userId );

            const player = PlayerFactory.createPlayerFromExistingUser( playerId, command.nickname );

            session.joinPlayer( player );

            return Either.makeRight( true ); 

        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}