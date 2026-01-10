import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";

import { HostStartGameCommand } from "./host-start-game.command";
import { QuestionStartedResponse } from "../../response-dtos/question-started.response.dto";

import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";
import { mapToQuestionResponse } from "../../mappers";

import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Either } from '../../../../core/types/either';
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";
import { ErrorData } from "src/core/types";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { StartGameContext } from "../context/session-resources.context.interface";
import { createResponseNotGeneratedError } from "../context/errors/create-handler-errors.error";




@CommandHandler( HostStartGameCommand )
export class HostStartGameHandler implements ICommandHandler<HostStartGameCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        private readonly mediaService: MediaEnrichmentService,

        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
        private readonly logger: ILogger,
        
    ){}

    @Log()
    async execute(command: HostStartGameCommand): Promise<Either<ErrorData, QuestionStartedResponse>> {

        // Contexto para logs
        const appContext = createMultiplayerSessionAppContext('startGame', undefined, undefined, command.sessionPin);

        return pipeAsync<ErrorData, QuestionStartedResponse>(
            
            // 1. INICIO
            Either.makeRight(command),

            // 2. CARGAR SESIÓN (Async)
            cmd => cmd.chainAsync(c => this.loadSessionContext(c)),

            // 3. LÓGICA DE DOMINIO: INICIAR PARTIDA (Sync - Modifica estado)
            ctx => ctx.chain(c => this.startSessionDomainLogic(c)),

            // 4. GENERAR RESPUESTA & ENRIQUECIMIENTO (Async - Usa MediaService)
            ctx => ctx.chainAsync(c => this.buildInitialResponse(c)),

            // 5. INICIALIZAR TABLA DE RESULTADOS (Sync - Usa datos de la respuesta)
            ctx => ctx.chain(c => this.initSlideTracking(c)),

            // 6. PERSISTENCIA (Async - Guardar cambios de estado)
            ctx => ctx.chainAsync(c => this.persistState(c)),

            // 7. MAPEO FINAL
            // Extraemos la respuesta que generamos en el paso 4
            ctx => ctx.map(c => c.response!),

            // 8. ERRORES
            result => result.mapLeft(err => err.setContext(appContext))
        );
    }

    // --- MÉTODOS PRIVADOS ---

    /**
     * Paso 2: Cargar Sesión
     */
    private async loadSessionContext(
        command: HostStartGameCommand
    ): Promise<Either<ErrorData, StartGameContext>> {
        const result = await this.sessionRepository.findByPinEither(command.sessionPin);
        
        return result.map(sessionCtx => ({
            command,
            sessionCtx
        }));
    }

    /**
     * Paso 3: Lógica de Dominio (Start Session)
     * Protegido contra excepciones del Agregado
     */
    private startSessionDomainLogic(
        ctx: StartGameContext
    ): Either<ErrorData, StartGameContext> {
        const { session } = ctx.sessionCtx;

        try {
            // Cambio de estado: Lobby -> Question
            session.startSession();
            return Either.makeRight(ctx);

        } catch (error) {
            // Capturamos reglas de negocio (ej: "No hay suficientes jugadores")
            return Either.makeLeft(error as ErrorData);
        }
    }

    /**
     * Paso 4: Construir Respuesta (Async por MediaService)
     */
    private async buildInitialResponse(
        ctx: StartGameContext
    ): Promise<Either<ErrorData, StartGameContext>> {
        const { sessionCtx } = ctx;

        try {
            // Generamos la respuesta enriquecida
            const res = await mapToQuestionResponse(
                sessionCtx.session, 
                sessionCtx.kahoot, 
                this.mediaService
            );

            // La guardamos en el contexto
            return Either.makeRight({
                ...ctx,
                response: res
            });
        } catch (error) {
            return Either.makeLeft(error as ErrorData);
        }
    }

    /**
     * Paso 5: Inicializar Tracking de Resultados
     * Depende de que el paso 4 haya generado la respuesta con el ID del slide
     */
    private initSlideTracking(
        ctx: StartGameContext
    ): Either<ErrorData, StartGameContext> {
        const { sessionCtx, response } = ctx;

        // TS lo exige (aunque por el flujo sabemos que existe)
        if (!response) return Either.makeLeft( createResponseNotGeneratedError("enrichSlide"));

        try {
            const currentSlideId = new SlideId(response.data.currentSlideData.id);
            
            // Side effect en la sesión - iniciamos VO de resultados para la slide
            sessionCtx.session.startSlideResults(currentSlideId);
            
            return Either.makeRight(ctx);
        } catch (error) {
            return Either.makeLeft(error as ErrorData);
        }
    }

    /**
     * Paso 6: Persistir el nuevo estado (Started + Slide Results)
     */
    private async persistState(ctx: StartGameContext) {
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