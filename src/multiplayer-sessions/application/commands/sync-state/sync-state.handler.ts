import { Inject } from "@nestjs/common";
import { ICommandHandler } from "src/core/application/cqrs";
import { CommandHandler } from "src/core/infrastructure/cqrs";

import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";

import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";
import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";

import { SyncStateCommand } from "./sync-state.command";
import { SyncStateResponse } from "../../response-dtos/sync-state.response.dto";
import { mapEndToSyncState, mapLobbyToSyncState, mapQuestionToSyncState, mapResultsToSyncState, mapToQuestionResponse } from "../../mappers";

import { Either, ErrorData } from "src/core/types";

import { Log } from "src/core/application/aspects/logging/log.decorator";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";
import { SyncStateContext } from "../context/session-resources.context.interface";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";


@CommandHandler( SyncStateCommand )
export class SyncStateHandler implements ICommandHandler<SyncStateCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
        private readonly logger: ILogger,

        private readonly mediaService: MediaEnrichmentService,
    ){}

    @Log()
    async execute(command: SyncStateCommand): Promise<Either<ErrorData, SyncStateResponse>> {

        // Contexto para logs
        const appContext = createMultiplayerSessionAppContext('syncState', undefined, command.userId, command.sessionPin);

        return pipeAsync<ErrorData, SyncStateResponse>(
            
            // 1. INICIO
            Either.makeRight(command),

            // 2. CARGAR SESIÓN (Async)
            cmd => cmd.chainAsync(c => this.loadSessionContext(c)),

            // 3. ESTRATEGIA DE ESTADO (Async/Sync mixto)
            // Aquí delegamos la creación de la respuesta según el estado actual
            ctx => ctx.chainAsync(c => this.dispatchStateStrategy(c)),

            // 4. RESULTADO FINAL
            // Como es lectura, no hay persistencia. Solo devolvemos lo generado.
            ctx => ctx.map(c => c.response!),

            // 5. ERRORES
            result => result.mapLeft(err => err.setContext(appContext))
        );
    }

    // --- MÉTODOS PRIVADOS ---

    /**
     * Paso 2: Cargar Sesión
     */
    private async loadSessionContext(
        command: SyncStateCommand
    ): Promise<Either<ErrorData, SyncStateContext>> {
        const result = await this.sessionRepository.findByPinEither(command.sessionPin);

        return result.map(sessionCtx => ({
            command,
            sessionCtx
        }));
    }

    /**
     * Paso 3: Dispatcher (Router de Estados)
     */
    private async dispatchStateStrategy(
        ctx: SyncStateContext
    ): Promise<Either<ErrorData, SyncStateContext>> {
        const { session } = ctx.sessionCtx;
        const currentState = session.getSessionState().getActualState();

        switch (currentState) {
            case SessionStateType.LOBBY:
                return this.handleLobbyState(ctx);

            case SessionStateType.QUESTION:
                return this.handleQuestionState(ctx);

            case SessionStateType.RESULTS:
                return this.handleResultsState(ctx);

            case SessionStateType.END:
                return this.handleEndState(ctx);

            default:
                // Caso defensivo por si entra un estado corrupto o nuevo no implementado
                return Either.makeLeft(new Error(`Estado de sesión desconocido o no manejado: ${currentState}`) as ErrorData);
        }
    }

    // --- MANEJADORES DE ESTADO ESPECÍFICOS ---

    /**
     * Estrategia: LOBBY (Sync)
     */
    private handleLobbyState(ctx: SyncStateContext): Either<ErrorData, SyncStateContext> {
        const { sessionCtx, command } = ctx;
        try {
            const res = mapLobbyToSyncState(sessionCtx.session, command);
            return Either.makeRight({ ...ctx, response: res });
        } catch (error) {
            return Either.makeLeft(error as ErrorData);
        }
    }

    /**
     * Estrategia: QUESTION (Async - Requiere MediaService)
     */
    private async handleQuestionState(ctx: SyncStateContext): Promise<Either<ErrorData, SyncStateContext>> {
        const { sessionCtx, command } = ctx;
        try {
            // 1. Necesitamos datos enriquecidos de la pregunta actual
            const questionData = await mapToQuestionResponse(
                sessionCtx.session, 
                sessionCtx.kahoot, 
                this.mediaService
            );

            // 2. Construimos la respuesta de sincronización usando esos datos
            const res = mapQuestionToSyncState(
                sessionCtx.session, 
                sessionCtx.kahoot, 
                questionData, 
                command
            );

            return Either.makeRight({ ...ctx, response: res });
        } catch (error) {
            return Either.makeLeft(error as ErrorData);
        }
    }

    /**
     * Estrategia: RESULTS (Sync)
     */
    private handleResultsState(ctx: SyncStateContext): Either<ErrorData, SyncStateContext> {
        const { sessionCtx, command } = ctx;
        try {
            const res = mapResultsToSyncState(sessionCtx.session, sessionCtx.kahoot, command);
            return Either.makeRight({ ...ctx, response: res });
        } catch (error) {
            return Either.makeLeft(error as ErrorData);
        }
    }

    /**
     * Estrategia: END (Sync)
     */
    private handleEndState(ctx: SyncStateContext): Either<ErrorData, SyncStateContext> {
        const { sessionCtx, command } = ctx;
        try {
            const res = mapEndToSyncState(sessionCtx.session, command);
            return Either.makeRight({ ...ctx, response: res });
        } catch (error) {
            return Either.makeLeft(error as ErrorData);
        }
    }

    
    // @Log()
    // async execute(
    //     command: SyncStateCommand
    // ): Promise<Either<Error, SyncStateResponse>> {


    //     try {
    //         // Cargamos el agregado session desde el repositorio en memoria
    //         const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

    //         if( !sessionWrapper )
    //             return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

    //         const { session, kahoot } = sessionWrapper

    //         const state = session.getSessionState();


    //         switch( state.getActualState() ) {


    //             case( SessionStateType.LOBBY ): {

    //                 const res = mapLobbyToSyncState( session, command );
    //                 return Either.makeRight( res );
                    
    //             }

    //             case( SessionStateType.QUESTION ): {

    //                 const question = await mapToQuestionResponse( session, kahoot, this.mediaService );
    //                 const res = mapQuestionToSyncState( session, kahoot, question, command );
                    
    //                 return Either.makeRight( res );

    //             }

    //             case( SessionStateType.RESULTS ): {

    //                 const res = mapResultsToSyncState( session, kahoot, command );
    //                 return Either.makeRight( res );

    //             }

    //             case( SessionStateType.END ): {

    //                 const res = mapEndToSyncState( session, command );
    //                 return Either.makeRight(res);

    //             }

    //         }

   

    //     } catch (error) {

    //         return Either.makeLeft( error );

    //     }

    // }

}