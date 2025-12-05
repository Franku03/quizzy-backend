import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InMemorySessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import { COMMON_ERRORS } from "../common.errors";



import { HostNextPhaseCommand } from "./host-next-phase.command";
import { QuestionStartedResponse } from "../../response-dtos/question-started.response.dto";
import { QuestionResultsResponse } from "../../response-dtos/question-results.response.dto";
import { GameEndedResponse } from "../../response-dtos/game-ended.response.dto";

import { UpdateSessionProgressAndRankingService } from "src/multiplayer-sessions/domain/domain-services";
import { Either } from '../../../../core/types/either';
import { HOST_NEXT_PHASE_ERRORS } from "./host-next-phase.errors";
import { mapSnapshotsToQuestionResponse } from "../../helpers/map-snapshots-to-response";
import { mapEntriesToResponse } from "../../helpers/map-entries-to-scoreboard";

@CommandHandler( HostNextPhaseCommand )
export class HostNextPhaseHandler implements ICommandHandler<HostNextPhaseCommand> {

    private readonly updateProgressAndRankingService: UpdateSessionProgressAndRankingService;

    constructor(
        @Inject( InMemorySessionRepository )
        private readonly sessionRepository: InMemorySessionRepository,
    ){
        this.updateProgressAndRankingService = new UpdateSessionProgressAndRankingService()
    }

    async execute(command: HostNextPhaseCommand): Promise<Either<Error, QuestionStartedResponse | QuestionResultsResponse | GameEndedResponse >> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

            const { session, kahoot } = sessionWrapper

            if( session.getSessionState().isQuestion() ){

                this.updateProgressAndRankingService.updateSessionProgressAndRanking( kahoot, session );

                // ? Avanzamos a results

                session.advanceToNextPhase();

                const response = mapEntriesToResponse( session, kahoot );

                // ! Puede ocurrir que aqui llege un END
                if( session.getSessionState().isEnd() ){

                    
                    const { playerScoreboard } = mapEntriesToResponse( session, kahoot );

                    return Either.makeRight({
                        state: session.getSessionStateType(),
                        finalScoreboard: playerScoreboard,
                        winnerNickname: playerScoreboard[0].nickname,
                    });

                } else {
 
                    return Either.makeRight( response );


                }



            }else if( session.getSessionState().isResults() ){

                const currentSlideIndex = session.getTotalOfSlidesAnswered();

                // ? Avanzamos a question
                session.advanceToNextPhase();

                const currentSlideSnapshot = mapSnapshotsToQuestionResponse( session, kahoot );

                // ! Puede ocurrir que aqui llege un END
                if( session.getSessionState().isEnd() ){


                    const { playerScoreboard } = mapEntriesToResponse( session, kahoot );

                    return Either.makeRight({
                        state: session.getSessionStateType(),
                        finalScoreboard: playerScoreboard,
                        winnerNickname: playerScoreboard[0].nickname,
                    });

                }else {

    
                    return Either.makeRight({
                        state: session.getSessionStateType(),
                        questionIndex: currentSlideIndex,
                        currentSlideData: currentSlideSnapshot
                    });


                }



            } else {

                return Either.makeLeft( new Error(HOST_NEXT_PHASE_ERRORS.SESSION_INVALID_STATE) );
                
            }


   
        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}