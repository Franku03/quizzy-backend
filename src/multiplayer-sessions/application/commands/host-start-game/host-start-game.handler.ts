import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InMemorySessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import { HostStartGameCommand } from "./host-start-game.command";
import { COMMON_ERRORS } from "../common.errors";
import { HOST_START_GAME_ERRORS } from "./host-start-game.errors";
import { QuestionStartedResponse } from "../../response-dtos/question-started.response";


import { Either } from '../../../../core/types/either';



@CommandHandler( HostStartGameCommand )
export class HostStartGameHandler implements ICommandHandler<HostStartGameCommand> {

    constructor(
        @Inject( InMemorySessionRepository )
        private readonly sessionRepository: InMemorySessionRepository,
    ){}

    async execute(command: HostStartGameCommand): Promise<Either<Error, QuestionStartedResponse>> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );


            const { session, kahoot } = sessionWrapper

            // Verificamos algunas incoherencias con los datos a devolver

            const currentSlideSnapshot = kahoot.getNextSlideSnapshotByIndex();

            if( !currentSlideSnapshot )
                return Either.makeLeft( new Error(HOST_START_GAME_ERRORS.SESSION_ALREADY_BEGUN) );



            const currentSlideIndex = session.getTotalOfSlidesAnswered();

            if( currentSlideIndex !== 0 )
                return Either.makeLeft( new Error(HOST_START_GAME_ERRORS.NO_SLIDES) );


            // Ahora si, iniciamos la partida
            const state = session.startSession().getActualState();


            return Either.makeRight({
                questionIndex: currentSlideIndex,
                currentSlideData: currentSlideSnapshot
            });

   
        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}