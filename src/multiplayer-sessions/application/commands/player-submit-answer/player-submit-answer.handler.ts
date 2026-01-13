/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\player-submit-answer\player-submit-answer.handler.ts

import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/adapters/in-memory.session.repository";
import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";

import { PlayerSubmitAnswerCommand } from "./player-submit-answer.command";
import { PlayerSubmitAnswerResponse } from "../../response-dtos";


import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { SubmissionFactory } from "src/core/domain/factories/submission.factory";
import { PlayerSubmissionEvaluationService } from "src/multiplayer-sessions/domain/domain-services/player-submission-evaluation.service";

import { Either } from '../../../../core/types/either';
import { ErrorData } from "src/core/types";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";

import { PlayerSubmitContextWithSession, PlayerSubmitContextWithSlide } from "../context/session-resources.context.interface";
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";
import { createSlideNotFoundError } from "../context/errors/create-handler-errors.error";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";


@CommandHandler( PlayerSubmitAnswerCommand )
export class PlayerSubmitAnswerHandler implements ICommandHandler<PlayerSubmitAnswerCommand> {

    private readonly playerSubmissionEvaluationService: PlayerSubmissionEvaluationService

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
        private readonly logger: ILogger,
    ){
        this.playerSubmissionEvaluationService = new PlayerSubmissionEvaluationService()
    }

    @Log()
    async execute(command: PlayerSubmitAnswerCommand): Promise<Either<ErrorData, PlayerSubmitAnswerResponse>> {

        // Contexto para logs (incluimos sessionPin y questionId)
        const appContext = createMultiplayerSessionAppContext('submitAnswer', { actorId: command.userId, sessionPin: command.sessionPin });

        return pipeAsync<ErrorData, PlayerSubmitAnswerResponse>(
            
            Either.makeRight(command),

            cmd => cmd.chainAsync(c => this.loadSessionContext(c)),

            // 3) Validar slide antes de seguir
            // Buscamos el slide y verificamos que exista. Si no, devolvemos Left.
            // Input: Context -> Output: Promise<Either<Error, Context + SlideInfo>>
            ctx => ctx.chain(c => this.validateAndLoadSlide(c)),

            // 4) Construir Submission y evaluar para registrar resultado
            // Usamos Factory + Servicio de Dominio
            // Input: Context -> Output: Promise<Either<Error, Context + Submission>>
            ctx => ctx.chain(c => this.processSubmission(c)),

            // 5) Actualizamos la sesión en memoria (lastActivity)
            ctx => ctx.chainAsync(c => this.persistState(c)),

            // 6) Respuesta - Calculamos el número de respuestas hasta ahora para notificar al host
            ctx => ctx.map( (c: PlayerSubmitContextWithSlide ) => ({ 
                numberOfSubmissions: c.sessionCtx.session.getNumberOfAnswersForASlide( c.slideId ) ?? 0 // Si llega 0 quiere decir que hubo un error con la slide solicitada
            })),

            // 7. ERRORES
            result => result.mapLeft(err => err.setContext(appContext))
        );
    }

    // --- MÉTODOS PRIVADOS ---

    /**
     * Cargar Sesión
     */
    private async loadSessionContext(
        command: PlayerSubmitAnswerCommand
    ): Promise<Either<ErrorData, PlayerSubmitContextWithSession>> {
        const result = await this.sessionRepository.findByPinEither(command.sessionPin);

        return result.map(sessionCtx => ({
            command,
            sessionCtx,
        })); 
    }

    /**
     * Validar Slide (Transformar Nullable a Either)
     */
    private validateAndLoadSlide(
        ctx: PlayerSubmitContextWithSession
    ): Either<ErrorData, PlayerSubmitContextWithSlide> {
        const { command, sessionCtx } = ctx;
        
        const slideId = new SlideId(command.questionId);
        
        const slideSnapshot = sessionCtx.kahoot.getSlideSnapshotById(slideId);

        if (!slideSnapshot) {
            return Either.makeLeft( createSlideNotFoundError("getSlideSnapshotById", sessionCtx.kahoot.id.value, command.userId ) );
        }

        return Either.makeRight({
            ...ctx,
            slideId,
            slideSnapshot
        });
    }

    /**
     * Procesar submit del usuario con Factory + Servicio de Dominio
     */
    private processSubmission(
        ctx: PlayerSubmitContextWithSlide
    ): Either<ErrorData, PlayerSubmitContextWithSlide> {
        
        const { command, sessionCtx, slideId, slideSnapshot } = ctx;
        const { session, kahoot } = sessionCtx;

        const playerSubmissionResult = SubmissionFactory.buildDomainSubmission(
            slideId,
            slideSnapshot,
            command.timeElapsedMs,
            command.answerId,
        );

        // 2) Encadenamos - Usamos chain (síncrono) porque la factory era síncrona.
        return playerSubmissionResult.chain( playerSubmission => {
            
                const evaluationResult = this.playerSubmissionEvaluationService.evaluatePlayerSubmission(
                    kahoot,
                    session,
                    [command.userId, playerSubmission],
                    slideId
                );

                // Mapeamos el Either resultante del servicio (Left o Right) al contexto.
                return evaluationResult.map(() => ctx);

 
        });
    }

    /**
     * actualizar actividad
     */
    private async persistState( ctx: PlayerSubmitContextWithSlide ): Promise<Either< ErrorData, PlayerSubmitContextWithSlide >> {
        // Usamos updateSession para renovar actividad
        const saveResult = await this.sessionRepository.updateSessionEither(ctx.sessionCtx.session.getSessionPin());
        
        return saveResult.map(() => ctx);
    }

    // async execute(command: PlayerSubmitAnswerCommand): Promise<Either<Error, PlayerSubmitAnswerResponse>> {


    //     try {
    //         // Cargamos el agregado session desde el repositorio en memoria
    //         const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

    //         if( !sessionWrapper )
    //             return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

    //         const { session, kahoot } = sessionWrapper
            

    //         const slideId = new SlideId( command.questionId );

    //         const slideSnapshot = kahoot.getSlideSnapshotById( slideId );

    //         if( !slideSnapshot )
    //             return Either.makeLeft( new Error(PLAYER_SUBMIT_ERRORS.SLIDE_NOT_FOUND) );

    //         const playerSumission = SubmissionFactory.buildDomainSubmission(
    //             slideId,
    //             slideSnapshot,
    //             command.timeElapsedMs,
    //             command.answerId,
    //         );

    //         // Procesamos la evaluacion mediante un servicio de dominio
    //         this.playerSubmissionEvaluationService.evaluatePlayerSubmission(
    //             kahoot,
    //             session,
    //             [command.userId, playerSumission],
    //             slideId
    //         );

    //         return Either.makeRight( { 
    //             numberOfSubmissions: session.getNumberOfAnswersForASlide( slideId )
    //         });
   
    //     } catch (error) {

    //         return Either.makeLeft( error );

    //     }

    // }

}