import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { HostNextPhaseCommand } from "./host-next-phase.command";
import { HostNextPhaseResponse } from '../../response-dtos/types/host-next-phase-response.type';

import { StateTransitionsTypes } from "src/multiplayer-sessions/domain/types";
import { SessionArchiverService, UpdateSessionProgressAndRankingService } from "src/multiplayer-sessions/domain/domain-services";
import type { IActiveMultiplayerSessionRepository, IMultiplayerSessionHistoryRepository } from "src/multiplayer-sessions/domain/ports";

import { mapEntriesToResultsResponse, mapFinalScoreboard, mapToQuestionResponse } from "../../mappers";

import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";
import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { Either } from '../../../../core/types/either';
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";

import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import { ErrorData, ErrorLayer } from "src/core/types";
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

        @Inject(RepositoryName.MultiplayerSession)
        private readonly sessionSavingRepository: IMultiplayerSessionHistoryRepository,

        
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
        private readonly logger: ILogger,

        private readonly mediaService: MediaEnrichmentService,
    ){
        this.updateProgressAndRankingService = new UpdateSessionProgressAndRankingService();

        this.sessionArchiverService = new SessionArchiverService(
            this.sessionSavingRepository,
            this.sessionRepository
        )
    }


    @Log()
    async execute(command: HostNextPhaseCommand): Promise<Either<ErrorData, HostNextPhaseResponse>> {

        const appContext = createMultiplayerSessionAppContext('nextPhase', undefined, undefined, command.sessionPin);

        return pipeAsync<ErrorData, HostNextPhaseResponse>(
            
            // 1. INICIO
            Either.makeRight(command),

            // 2. CARGAR SESIÓN
            cmd => cmd.chainAsync(c => this.loadSessionContext(c)),

            // 3. ACTUALIZAR RANKING (Si aplica)
            // Lógica: Si estamos en QUESTION, calculamos puntajes ANTES de cambiar de fase.
            ctx => ctx.chain(c => this.updateScoresIfNecessary(c)),

            // 4. TRANSICIONAR ESTADO (Core Logic)
            // Ejecuta session.advanceToNextPhase() y guarda el tipo de transición
            ctx => ctx.chain(c => this.advancePhase(c)),

            // 5. MANEJAR TRANSICIÓN (Switch Gigante: Respuesta + Persistencia)
            // Aquí es donde los caminos se bifurcan (Memoria vs Archivo)
            ctx => ctx.chainAsync(c => this.handleTransitionStrategy(c)),

            // 6. RESULTADO FINAL
            ctx => ctx.map(c => c.response!),

            // 7. ERRORES
            result => result.mapLeft(err => err.setContext(appContext))
        );
    }

    // --- MÉTODOS PRIVADOS ---

    /**
     * Paso 2: Cargar Sesión
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
     * Paso 3: Actualizar Scores (Sync)
     * Verifica pre-condición y ejecuta servicio de dominio si es necesario.
     */
    private updateScoresIfNecessary(
        ctx: NextPhaseContext
    ): Either<ErrorData, NextPhaseContext> {
        const { session, kahoot } = ctx.sessionCtx;

        try {
            // "Si la sesión ESTÁ en pregunta, significa que vamos a salir de ella hacia resultados"
            if (session.getSessionState().isQuestion()) {
                this.updateProgressAndRankingService.updateSessionProgressAndRanking(kahoot, session);
            }
            return Either.makeRight(ctx);
        } catch (error) {
            return Either.makeLeft(error as ErrorData);
        }
    }

    /**
     * Paso 4: Avanzar Fase (Sync)
     * Muta el estado de la sesión y retorna el ENUM de lo que pasó.
     */
    private advancePhase(
        ctx: NextPhaseContext
    ): Either<ErrorData, NextPhaseContext> {
        const { session } = ctx.sessionCtx;

        try {
            // El agregado valida si la transición es legal
            const transitionResult = session.advanceToNextPhase();
            
            return Either.makeRight({
                ...ctx,
                transitionType: transitionResult.state
            });
        } catch (error) {
             // Captura error: SESSION_INVALID_STATE, etc.
            return Either.makeLeft(error as ErrorData);
        }
    }

    /**
     * Paso 5: Estrategia de Transición (Async)
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
        try {
            // 1. Generar Respuesta (Async)
            const response = await mapToQuestionResponse(sessionCtx.session, sessionCtx.kahoot, this.mediaService);
            
            // 2. Persistir en Memoria (Async)
            await this.sessionRepository.updateSessionEither(sessionCtx.session.getSessionPin());

            return Either.makeRight({ ...ctx, response });
        } catch (error) {
            return Either.makeLeft(error as ErrorData);
        }
    }

    private async handleToResults(ctx: NextPhaseContext): Promise<Either<ErrorData, NextPhaseContext>> {
        const { sessionCtx } = ctx;
        try {
            // 1. Generar Respuesta (Sync)
            const response = mapEntriesToResultsResponse(sessionCtx.session, sessionCtx.kahoot);
            
            // 2. Persistir en Memoria (Async)
            // Aunque el mapa sea sync, guardar es async.
            await this.sessionRepository.updateSessionEither(sessionCtx.session.getSessionPin());

            return Either.makeRight({ ...ctx, response });
        } catch (error) {
            return Either.makeLeft(error as ErrorData);
        }
    }

    private async handleToEnd(ctx: NextPhaseContext): Promise<Either<ErrorData, NextPhaseContext>> {
        const { sessionCtx } = ctx;
      
        // 1. Generar Respuesta (Sync) - IMPORTANTE: Hacerlo ANTES de archivar/borrar
        // Una vez archivado, el objeto session podría ser limpiado o invalidado según implementación.
        const response = mapFinalScoreboard(sessionCtx.session);

        // 2. Archivar y Limpiar (Async - Destructive)
        // Persiste en BD
        try {
            const res = await this.sessionArchiverService.archiveSession(sessionCtx.session, sessionCtx.kahoot);
            return res.map( () => ({ ...ctx, response }) );
            
        } catch (error) {
           return Either.makeLeft( new ErrorData( "Invariant violation", error.message, ErrorLayer.APPLICATION ) )
        }

   
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