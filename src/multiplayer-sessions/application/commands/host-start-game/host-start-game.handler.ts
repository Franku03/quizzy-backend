import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { HostStartGameCommand } from "./host-start-game.command";
import { COMMON_ERRORS } from "../common.errors";
import { HOST_START_GAME_ERRORS } from "./host-start-game.errors";
import { QuestionStartedResponse } from "../../response-dtos/question-started.response.dto";

import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";

import { Either } from '../../../../core/types/either';
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";

import { mapSnapshotsToQuestionResponse } from "../../helpers/map-snapshots-to-response";



@CommandHandler( HostStartGameCommand )
export class HostStartGameHandler implements ICommandHandler<HostStartGameCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,
    ){}

    async execute(command: HostStartGameCommand): Promise<Either<Error, QuestionStartedResponse>> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );


            const { session, kahoot } = sessionWrapper

            // Verificamos algunas incoherencias con los datos a devolver

            const currentSlideIndex = session.getTotalOfSlidesAnswered();

            if( currentSlideIndex !== 0 )
                return Either.makeLeft( new Error(HOST_START_GAME_ERRORS.SESSION_ALREADY_BEGUN) );

            const currentSlideSnapshot = mapSnapshotsToQuestionResponse( session, kahoot);


            // ? Ahora si, iniciamos la partida

            session.startSession(); // Pasa a estado question automaticamente

            if( !session.getSessionState().isQuestion() )
                return Either.makeLeft( new Error(HOST_START_GAME_ERRORS.SESSION_ALREADY_BEGUN) );

            // * Creamos la tabla de resultados
            session.startSlideResults( new SlideId( currentSlideSnapshot.id ) );


            return Either.makeRight({
                state: session.getSessionStateType(),
                questionIndex: currentSlideIndex,
                currentSlideData: currentSlideSnapshot
            });

   
        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}