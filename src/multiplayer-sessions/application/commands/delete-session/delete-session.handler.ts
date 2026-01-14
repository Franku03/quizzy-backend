/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\delete-session\delete-session.handler.ts

import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { DeleteSessionCommand } from "./delete-session.command";

import type { IActiveMultiplayerSessionRepository, IPinRepository } from "src/multiplayer-sessions/domain/ports";
import type { ISessionConcurrencyManager } from "../../ports/i-session-concurrency-manager.interface";

import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";
import { DeleteSessionContext } from "../context/session-resources.context.interface";

import { Either, ErrorData } from "src/core/types";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";

// Este caso de uso es utilizado para borrar una sesion que pudo haber quedado en memoria tras finalizar una sesion de manera repentina
@CommandHandler( DeleteSessionCommand )
export class DeleteSessionHandler implements ICommandHandler<DeleteSessionCommand> {


    constructor(
        @Inject( APPLICATION_CORE_TOKENS.UTILS.ACTIVE_SESSION_REPO )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject( APPLICATION_CORE_TOKENS.UTILS.CONCURRENCY_MANAGER ) 
        private readonly concurrencyManager: ISessionConcurrencyManager,

        @Inject( APPLICATION_CORE_TOKENS.UTILS.LOGGER ) 
        private readonly logger: ILogger,

        @Inject( APPLICATION_CORE_TOKENS.UTILS.PIN_REPO )
        private readonly pinRepository: IPinRepository,
    ){}


    @Log()
    async execute(command: DeleteSessionCommand): Promise<Either<ErrorData, boolean>> {

        // Contexto para logs
        const appContext = createMultiplayerSessionAppContext('deleteSession', { sessionPin: command.sessionPin });

        return pipeAsync<ErrorData, boolean>(
            
            Either.makeRight(command),

            // 1) Liberar PIN
            // Lo hacemos primero para asegurar que el PIN quede libre, si la sesion queda perdida en memoria el repo la acabara limpiando a la hora
            cmd => cmd.chainAsync((c: DeleteSessionCommand) => this.releasePinStep(c)),

            // 2) Borrar sesion: Busca y borra si existe.
            ctx => ctx.chainAsync((c: DeleteSessionContext) => this.processSessionDeletion(c)),

            // 3) Obtenemos confirmación
            ctx => ctx.map((c: DeleteSessionContext) => c.wasDeleted),

            // 4) Mappear errores
            result => result.mapLeft(err => err.setContext(appContext))
        );
    }

    // --- MÉTODOS PRIVADOS ---

    /**
     * Liberar el PIN
     */
    private async releasePinStep(
        command: DeleteSessionCommand
    ): Promise<Either<ErrorData, DeleteSessionContext>> {
        const result = await this.pinRepository.releasePinEither(command.sessionPin);

        // Inicializamos el contexto con wasDeleted en false por defecto
        return result.map( () => ({
            command,
            wasDeleted: false
        }))
     
    }

    /**
     * Procesar el borrado de la sesión
     * Encapsula la lógica de "Buscar -> Verificar -> Borrar"
     */
    private async processSessionDeletion(
        ctx: DeleteSessionContext
    ): Promise<Either<ErrorData, DeleteSessionContext>> {
        const { command } = ctx;

        // 1) Buscamos el pin, la version sin Either resulta más cómoda ya que si no existe, podemos devolver Right con deleted en false
        const sessionWrapper = await this.sessionRepository.findByPin(command.sessionPin);

        // 2) Si no existe, no hacemos nada y retornamos éxito (idempotencia)
        if (!sessionWrapper) {
            return Either.makeRight({ ...ctx, wasDeleted: false });
        }

        // 3) Si existe, la borramos
        const result = await this.sessionRepository.deleteSessionEither(command.sessionPin);

        // 4) Limpiamos el candado, ya no hace falta pues la sesión va a ser cerrada
        this.concurrencyManager.deleteSessionLock( command.sessionPin );

        // 4) Afirmamos que borramos la sesion
        return result.map( () => ({ ...ctx, wasDeleted: true }) )

    }

    // async execute(command: DeleteSessionCommand): Promise<Either<Error, boolean>> {


    //     try {

    //         const { sessionPin } = command;

    //         // * Eliminamos el pin del txt para liberarlo, aqui finalmente se hace la sesión completamente inválida
    //         this.pinRepository.releasePin( sessionPin );

    //         // Cargamos el agregado session desde el repositorio en memoria
    //         const sessionWrapper = await this.sessionRepository.findByPin( sessionPin );

    //         // Si no encontramos sesion en memoria no pasa nada, devolvemos false para decir que no hizo falta borrar la sesion
    //         if( !sessionWrapper )
    //             return Either.makeRight( false );

    //         // Procesamos la limpieza de la session
    //         this.sessionRepository.deleteSession( sessionPin );
            

    //         // Habia una sesion por borrar y regresamos true para decir que ya fue liberada de memoria
    //         return Either.makeRight( true );
   
    //     } catch (error) {

    //         return Either.makeLeft( error );

    //     }

    // }

}