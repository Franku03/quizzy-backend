import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { HostStartGameCommand } from "./host-start-game.command";
import { COMMON_ERRORS } from "../common.errors";
import { HOST_START_GAME_ERRORS } from "./host-start-game.errors";
import { GameStartedResponse } from "../../response-dtos/game-started.response.dto";

import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";

import { Either } from '../../../../core/types/either';
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";

import { mapSnapshotsToQuestionResponse } from "../../mappers/map-snapshots-to-response";



@CommandHandler( HostStartGameCommand )
export class HostStartGameHandler implements ICommandHandler<HostStartGameCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,
    ){}

    async execute(command: HostStartGameCommand): Promise<Either<Error, GameStartedResponse>> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );


            const { session, kahoot } = sessionWrapper

            // * Mapeamos la slide actual (la primera) a formato de opciones sin mostrar la respuesta correcta
            const currentSlideSnapshot = mapSnapshotsToQuestionResponse( session, kahoot );

            // * Iniciamos la partida
            session.startSession(); // Pasa a estado question automaticamente

            // * Creamos la tabla de resultados
            session.startSlideResults( new SlideId( currentSlideSnapshot.id ) );

            return Either.makeRight({
                
                state: session.getSessionStateType(),
                questionIndex: session.getCurrentSlideIndex(),
                currentSlideData: currentSlideSnapshot
    
            });
   
        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}