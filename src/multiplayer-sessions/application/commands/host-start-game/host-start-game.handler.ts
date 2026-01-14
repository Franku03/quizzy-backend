/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\host-start-game\host-start-game.handler.ts

import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";

import { HostStartGameCommand } from "./host-start-game.command";
import { QuestionStartedResponse } from "../../response-dtos/question-started.response.dto";

import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";
import type { ISessionConcurrencyManager } from "../../ports/i-session-concurrency-manager.interface";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";
import { mapToQuestionResponse } from "../../mappers";

import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Either } from '../../../../core/types/either';
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";
import { ErrorData } from "src/core/types";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { StartGameContextWithoutResponse, StartGameContextWithResponse } from "../context/session-resources.context.interface";



@CommandHandler( HostStartGameCommand )
export class HostStartGameHandler implements ICommandHandler<HostStartGameCommand> {

    constructor(
        @Inject( APPLICATION_CORE_TOKENS.UTILS.ACTIVE_SESSION_REPO )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject( APPLICATION_CORE_TOKENS.UTILS.CONCURRENCY_MANAGER ) 
        private readonly concurrencyManager: ISessionConcurrencyManager,
        
        private readonly mediaService: MediaEnrichmentService,

        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
        private readonly logger: ILogger,
        
    ){}

    @Log()
    async execute(command: HostStartGameCommand): Promise<Either<ErrorData, QuestionStartedResponse>> {

        // Contexto para logs
        const appContext = createMultiplayerSessionAppContext('startGame',{ sessionPin: command.sessionPin } );

        return this.concurrencyManager.runInSequence( command.sessionPin, async () => {
 
            return pipeAsync<ErrorData, QuestionStartedResponse>(
                
                Either.makeRight(command),
    
                cmd => cmd.chainAsync((c: HostStartGameCommand) => this.loadSessionContext(c)),
    
                // 1) Lógica de dominio: iniciar partida
                ctx => ctx.chain((c: StartGameContextWithResponse) => this.startSessionDomainLogic(c)),
    
                // 2) Mappear respuseta y enriquecer con urls
                ctx => ctx.chainAsync((c: StartGameContextWithoutResponse) => this.buildInitialResponse(c)),
    
                // 3) Iniciarlizar tabla de resultados
                ctx => ctx.chain((c: StartGameContextWithResponse )=> this.initSlideResultsTracking(c)),
    
                // 4) Actualizar cambios en la BD
                ctx => ctx.chainAsync((c: StartGameContextWithResponse ) => this.persistState(c)),
    
                // 5) Mappeo final - Extraemos la respuesta que generamos en el paso 4
                ctx => ctx.map((c: StartGameContextWithResponse) => c.response!),
    
                // 6) Mappeo de errores
                result => result.mapLeft(err => err.setContext(appContext))
            );

        })

    }

    // --- MÉTODOS PRIVADOS ---

    /**
     * Cargar Sesión
     */
    private async loadSessionContext(
        command: HostStartGameCommand
    ): Promise<Either<ErrorData, StartGameContextWithoutResponse>> {
        const result = await this.sessionRepository.findByPinEither(command.sessionPin);
        
        return result.map(sessionCtx => ({
            command,
            sessionCtx
        }));
    }

    /**
     * Iniciar sesión a nivel de dominio
     */
    private startSessionDomainLogic(
        ctx: StartGameContextWithoutResponse
    ): Either<ErrorData, StartGameContextWithoutResponse > {
        const { session } = ctx.sessionCtx;

        return session.startSession()
                    .map(() => ctx );
 
    }

    /**
     * Mappear Respuesta 
     */
    private async buildInitialResponse(
        ctx: StartGameContextWithoutResponse
    ): Promise<Either<ErrorData, StartGameContextWithResponse>> {
        const { sessionCtx } = ctx;

        // Generamos la respuesta enriquecida
        const res = await mapToQuestionResponse(
            sessionCtx.session, 
            sessionCtx.kahoot, 
            this.mediaService
        );

        return res.map( res => ({
            ...ctx,
            response: res
        }));

    }

    /**
     * Inicializar Tracking de Resultados
     */
    private initSlideResultsTracking(
        ctx: StartGameContextWithResponse
    ): Either<ErrorData, StartGameContextWithResponse> {

        const { sessionCtx, response } = ctx;

        const currentSlideId = new SlideId(response.data.currentSlideData.id);
        
        // Iniciamos VO de resultados para la slide
        sessionCtx.session.startSlideResults(currentSlideId);
        
        return Either.makeRight(ctx);

    }

    /**
     * Actualizar actividad en la sesión
     */
    private async persistState(ctx: StartGameContextWithResponse) {
        const saveResult = await this.sessionRepository.updateSessionEither(
            ctx.sessionCtx.session.getSessionPin()
        );
        return saveResult.map(() => ctx);
    }
}

    // async execute(command: HostStartGameCommand): Promise<Either<Error, QuestionStartedResponse>> {


    //     try {
    //         // Cargamos el agregado session desde el repositorio en memoria
    //         const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

    //         if( !sessionWrapper )
    //             return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );


    //         const { session, kahoot } = sessionWrapper
            
    //         // Iniciamos la partida
    //         session.startSession(); // Pasa a estado question automaticamente

    //         // Mapeamos la slide actual (la primera) a formato de opciones sin mostrar la respuesta correcta, y obtenemos directamente los datos de la respuesta a dar
    //         const res = await mapToQuestionResponse( session, kahoot, this.mediaService );

    //         // Creamos la tabla de resultados para la primera slide
    //         session.startSlideResults( new SlideId( res.data.currentSlideData.id ) );

    //         return Either.makeRight( res );
   
    //     } catch (error) {

    //         return Either.makeLeft( error );

    //     }

    // }

    // }