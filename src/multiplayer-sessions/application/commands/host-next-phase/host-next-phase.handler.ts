/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\host-next-phase\host-next-phase.handler.ts

import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { HostNextPhaseCommand } from "./host-next-phase.command";
import { HostNextPhaseResponse } from '../../response-dtos/types/host-next-phase-response.type';

import { StateTransitionsTypes } from "src/multiplayer-sessions/domain/types";
import { SessionArchiverService, UpdateSessionProgressAndRankingService } from "src/multiplayer-sessions/domain/domain-services";
import type { IActiveMultiplayerSessionRepository, IMultiplayerSessionHistoryRepository } from "src/multiplayer-sessions/domain/ports";
import type { ISessionConcurrencyManager } from "../../ports/i-session-concurrency-manager.interface";

import { mapEntriesToResultsResponse, mapFinalScoreboard, mapToQuestionResponse } from "../../mappers";

import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";
import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/adapters/in-memory.session.repository";
import { MutexSessionConcurrencyManager } from "src/multiplayer-sessions/infrastructure/adapters";

import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { Either } from '../../../../core/types/either';
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";

import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import { ErrorData } from "src/core/types";
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { NextPhaseContext } from "../context/session-resources.context.interface";
import { createInvalidTransitionStateError } from "../context/errors/create-handler-errors.error";

@CommandHandler( HostNextPhaseCommand )
export class HostNextPhaseHandler implements ICommandHandler<HostNextPhaseCommand> {

    private readonly updateProgressAndRankingService: UpdateSessionProgressAndRankingService;
    private readonly sessionArchiverService: SessionArchiverService;

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject( MutexSessionConcurrencyManager ) 
        private readonly concurrencyManager: ISessionConcurrencyManager,

        @Inject(RepositoryName.MultiplayerSession)
        private readonly sessionSavingRepository: IMultiplayerSessionHistoryRepository,
        
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
        private readonly logger: ILogger,

        private readonly mediaService: MediaEnrichmentService,
    ){
        this.updateProgressAndRankingService = new UpdateSessionProgressAndRankingService();

        this.sessionArchiverService = new SessionArchiverService(
            this.sessionSavingRepository,
        )
    }


    @Log()
    async execute(command: HostNextPhaseCommand): Promise<Either<ErrorData, HostNextPhaseResponse>> {

        const appContext = createMultiplayerSessionAppContext('nextPhase', { sessionPin: command.sessionPin });

        return this.concurrencyManager.runInSequence( command.sessionPin, async () => {


            return pipeAsync<ErrorData, HostNextPhaseResponse>(
                
                Either.makeRight(command),
    
                cmd => cmd.chainAsync(c => this.loadSessionContext(c)),
    
                // 3) Actualizar Ranking solo si estamos en QUESTIONS, calculamos puntajes antes de cambiar de estado
                ctx => ctx.chain(c => this.updateScoresIfNecessary(c)),
    
                // 4) Avanzamos de fase/estado en la partida
                ctx => ctx.chain(c => this.advancePhase(c)),
    
                // 5) Manejar transición y respuesta al usuario
                ctx => ctx.chainAsync(c => this.handleTransitionStrategy(c)),
    
                // 6) Resultado Final
                ctx => ctx.map(c => c.response!),
    
                // 7) Mappear errores
                result => result.mapLeft(err => err.setContext(appContext))
            );


        })

    }

    // --- MÉTODOS PRIVADOS ---

    /**
     * Cargar Sesión
     */
    private async loadSessionContext(
        command: HostNextPhaseCommand
    ): Promise<Either<ErrorData, NextPhaseContext>> {
        const result = await this.sessionRepository.findByPinEither(command.sessionPin);
        
        return result.map(sessionCtx => ({
            command,
            sessionCtx
        }));
    }

    /**
     * Actualizar Scores
     * Verifica pre-condición y ejecuta servicio de dominio si es necesario.
     */
    private updateScoresIfNecessary(
        ctx: NextPhaseContext
    ): Either<ErrorData, NextPhaseContext> {
        const { session, kahoot } = ctx.sessionCtx;


        if (session.getSessionState().isQuestion()) {

            const updateResult = this.updateProgressAndRankingService.updateSessionProgressAndRanking(kahoot, session);
            return updateResult.map( () => ctx )

        }

        return Either.makeRight(ctx);
   
    }

    /**
     * Avanzar Fase
     * Muta el estado de la sesión y retorna el ENUM de lo que pasó.
     */
    private advancePhase(
        ctx: NextPhaseContext
    ): Either<ErrorData, NextPhaseContext> {
        const { session } = ctx.sessionCtx;

        // El agregado valida si la transición es legal
        const transitionResult = session.advanceToNextPhase();

        return transitionResult.map( ( transitionResult ) => ({
            ...ctx,
            transitionType: transitionResult.state
        }));
        
    }

    /**
     * Estrategia de Transición
     * Combina Generación de Respuesta + Persistencia Específica
     */
    private async handleTransitionStrategy(
        ctx: NextPhaseContext
    ): Promise<Either<ErrorData, NextPhaseContext>> {
        const { transitionType } = ctx;

        switch (transitionType) {
            case StateTransitionsTypes.TRANSITION_TO_QUESTION:
                return this.handleToQuestion(ctx);

            case StateTransitionsTypes.TRANSITION_TO_RESULTS:
                return this.handleToResults(ctx);

            case StateTransitionsTypes.TRANSITION_TO_END:
                return this.handleToEnd(ctx);

            default:
                return Either.makeLeft( createInvalidTransitionStateError("transitionState", ctx.sessionCtx.session.id.value, ctx.command.sessionPin));
        }
    }

    // --- ESTRATEGIAS ESPECÍFICAS (Helpers del Paso 5) ---

    private async handleToQuestion(ctx: NextPhaseContext): Promise<Either<ErrorData, NextPhaseContext>> {
        const { sessionCtx } = ctx;

            const response = await mapToQuestionResponse(sessionCtx.session, sessionCtx.kahoot, this.mediaService);

            return response.chainAsync( async ( response ) => {

                // Actualizamos actividad de la sesion
                const result = await this.sessionRepository.updateSessionEither(sessionCtx.session.getSessionPin());

                return result.map(() => ({ ...ctx, response }))

            } )
            
    }

    private async handleToResults(ctx: NextPhaseContext): Promise<Either<ErrorData, NextPhaseContext>> {

        const { sessionCtx } = ctx;

        const response = mapEntriesToResultsResponse(sessionCtx.session, sessionCtx.kahoot);
        
        return response.chainAsync( async ( response ) => {

            // Actualizamos actividad de la sesion
            const result = await this.sessionRepository.updateSessionEither(sessionCtx.session.getSessionPin());

            return result.map(() => ({ ...ctx, response }))

        } )
   
    }

    private async handleToEnd(ctx: NextPhaseContext): Promise<Either<ErrorData, NextPhaseContext>> {
        const { sessionCtx } = ctx;
      
        const response = mapFinalScoreboard(sessionCtx.session);

        const res = await this.sessionArchiverService.archiveSession(sessionCtx.session, sessionCtx.kahoot);
        return res.map( () => ({ ...ctx, response }) );      
    }

    // async execute(command: HostNextPhaseCommand): Promise<Either<Error, HostNextPhaseResponse >> {

    //     try {
    //         // Cargamos el agregado session desde el repositorio en memoria
    //         const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

    //         if( !sessionWrapper )
    //             return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

    //         const { session, kahoot } = sessionWrapper


    //         if( session.getSessionState().isQuestion() ){

    //             this.updateProgressAndRankingService.updateSessionProgressAndRanking( kahoot, session );
                
    //         }

    //         // 2) transicionar el estado de la sesión, el agregado se encarga de validar la transición
    //         const transitionResult = session.advanceToNextPhase();

    //         // 3) Mapear la respuesta según el estado correspondiente
    //         switch ( transitionResult.state ) {
    //             case StateTransitionsTypes.TRANSITION_TO_QUESTION:
    //                 {
    //                     const response = await mapToQuestionResponse( session, kahoot, this.mediaService );
    //                     return Either.makeRight( response );
    //                 }

    //             case StateTransitionsTypes.TRANSITION_TO_RESULTS:
    //                 {
    //                     const response = mapEntriesToResultsResponse( session, kahoot );
    //                     return Either.makeRight( response );
    //                 }

    //             case StateTransitionsTypes.TRANSITION_TO_END:
    //                 {
    //                     try {

    //                         // Guardamos la partida en persistencia y limpiamos recursos
    //                         await this.sessionArchiverService.archiveSession( session, kahoot );
    //                         // Mapear la respuesta de fin de juego          
    //                         const response = mapFinalScoreboard( session );
    //                         return Either.makeRight(response);

    //                     } catch (error) {
    //                         // Si falla el guardado, podemos decidir qué hacer. Es Lo ideal: Retornar Error (Left) para que el controller lo sepa y el estado en memoria siga sucio pero recuperable
    //                         return Either.makeLeft(new Error("Error crítico guardando la partida: " + error.message));
    //                     }

    //                 }

    //             default:
    //                 return Either.makeLeft( new Error(HOST_NEXT_PHASE_ERRORS.SESSION_INVALID_STATE) );
                
    //         }

    //     } catch (error) {

    //         return Either.makeLeft( error );

    //     }

    // }

}