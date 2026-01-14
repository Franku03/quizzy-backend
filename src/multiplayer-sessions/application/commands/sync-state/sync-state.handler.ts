/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\sync-state\sync-state.handler.ts

import { Inject } from "@nestjs/common";
import { ICommandHandler } from "src/core/application/cqrs";
import { CommandHandler } from "src/core/infrastructure/cqrs";

import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";

import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";
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
import { createInvalidSyncStateError } from "../context/errors/create-handler-errors.error";


@CommandHandler( SyncStateCommand )
export class SyncStateHandler implements ICommandHandler<SyncStateCommand> {

    constructor(
        @Inject( APPLICATION_CORE_TOKENS.UTILS.ACTIVE_SESSION_REPO )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
        private readonly logger: ILogger,

        private readonly mediaService: MediaEnrichmentService,
    ){}

    @Log()
    async execute(command: SyncStateCommand): Promise<Either<ErrorData, SyncStateResponse>> {

        // Contexto para logs
        const appContext = createMultiplayerSessionAppContext('syncState', { actorId: command.userId, sessionPin: command.sessionPin });

        return pipeAsync<ErrorData, SyncStateResponse>(
            
            Either.makeRight(command),

            cmd => cmd.chainAsync((c: SyncStateCommand) => this.loadSessionContext(c)),

            // 3) Estrategia de sincronización según estado
            // Aquí delegamos la creación de la respuesta según el estado actual
            ctx => ctx.chainAsync((c: SyncStateContext) => this.dispatchStateStrategy(c)),

            // 4) Mapeamos el resultado final
            // Como es lectura, no hay persistencia. Solo devolvemos lo generado.
            ctx => ctx.map((c: SyncStateContext) => c.response!),

            // 5) Mappeo de errores
            result => result.mapLeft(err => err.setContext(appContext))
        );
    }

    // --- MÉTODOS PRIVADOS ---

    /**
     * Cargar Sesión
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
     * Dispatcher (Router de Estados)
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
                return Either.makeLeft( createInvalidSyncStateError( "SyncState", ctx.sessionCtx.session.id.value, ctx.command.sessionPin ));
        }
    }

    // --- MANEJADORES DE ESTADO ESPECÍFICOS ---

    /**
     * Estrategia: LOBBY
     */
    private handleLobbyState(ctx: SyncStateContext): Either<ErrorData, SyncStateContext> {
        
        const { sessionCtx, command } = ctx;
        const res = mapLobbyToSyncState(sessionCtx.session, command);

        //Adjuntamos el theme Enriquecido durante el create session a la respuesta
        const enrichedRes = { ...res,  theme: sessionCtx.sessionStyling.theme || { id: '', url: '', name: '' } }

        return Either.makeRight({ ...ctx, response: enrichedRes });
  
    }

    /**
     * Estrategia: QUESTION
     */
    private async handleQuestionState(ctx: SyncStateContext): Promise<Either<ErrorData, SyncStateContext>> {

        const { sessionCtx, command } = ctx;

        const questionDataRes = await mapToQuestionResponse( sessionCtx.session, sessionCtx.kahoot, this.mediaService );

        return questionDataRes.chain( ( questionData ) => {

            const res = mapQuestionToSyncState( sessionCtx.session, sessionCtx.kahoot, questionData, command);

            const enrichedRes = {
                 ...res,  
                 theme: sessionCtx.sessionStyling.theme || { id: '', url: '', name: '' } 
            }

            return Either.makeRight({ ...ctx, response: enrichedRes });

        })
  
    }

    /**
     * Estrategia: RESULTS
     */
    private handleResultsState(ctx: SyncStateContext): Either<ErrorData, SyncStateContext> {
        const { sessionCtx, command } = ctx;

        const res = mapResultsToSyncState(sessionCtx.session, sessionCtx.kahoot, command);

        // enriquecemos con map pq este mapper retorna un Either
        const enrichedRes = res.map( res => ( {
            ...res,
            theme: sessionCtx.sessionStyling.theme || { id: '', url: '', name: '' }
        }));

        return enrichedRes.map( enrichedRes => ({ ...ctx, response: enrichedRes }) )


 
    }

    /**
     * Estrategia: END
     */
    private handleEndState(ctx: SyncStateContext): Either<ErrorData, SyncStateContext> {
        
        const { sessionCtx, command } = ctx;
        const res = mapEndToSyncState(sessionCtx.session, command);
        const enrichedRes = { ...res,  theme: sessionCtx.sessionStyling.theme || { id: '', url: '', name: '' } }
        return Either.makeRight({ ...ctx, response: enrichedRes });

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