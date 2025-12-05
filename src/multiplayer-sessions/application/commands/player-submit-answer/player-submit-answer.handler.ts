import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InMemorySessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import { PlayerSubmitAnswerCommand } from "./player-submit-answer.command";
import { COMMON_ERRORS } from "../common.errors";
import { PLAYER_SUBMIT_ERRORS } from "./player-submit-answer.errors";


import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { SubmissionFactory } from "src/core/domain/factories/submission.factory";


import { Either } from '../../../../core/types/either';
import { PlayerSubmissionEvaluationService } from "src/multiplayer-sessions/domain/domain-services/player-submission-evaluation.service";


@CommandHandler( PlayerSubmitAnswerCommand )
export class PlayerSubmitAnswerHandler implements ICommandHandler<PlayerSubmitAnswerCommand> {

    private readonly playerSubmissionEvaluationService: PlayerSubmissionEvaluationService

    constructor(
        @Inject( InMemorySessionRepository )
        private readonly sessionRepository: InMemorySessionRepository,
    ){
        this.playerSubmissionEvaluationService = new PlayerSubmissionEvaluationService()
    }

    async execute(command: PlayerSubmitAnswerCommand): Promise<Either<Error, boolean >> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

            const { session, kahoot } = sessionWrapper

            const slideId = new SlideId( command.questionId );

            const slideSnapshot = kahoot.getSlideSnapshotById( slideId );

            
            if( !slideSnapshot )
                return Either.makeLeft( new Error(PLAYER_SUBMIT_ERRORS.SLIDE_NOT_FOUND) );

            const playerSumission = SubmissionFactory.buildDomainSubmission(
                slideId,
                slideSnapshot,
                command.timeElapsedMs,
                command.answerId,
            );

            // Procesamos la evaluacion mediante un servicio de dominio
            this.playerSubmissionEvaluationService.evaluatePlayerSubmission(
                kahoot,
                session,
                [command.userId, playerSumission],
                slideId
            );

            return Either.makeRight( true );
   
        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}