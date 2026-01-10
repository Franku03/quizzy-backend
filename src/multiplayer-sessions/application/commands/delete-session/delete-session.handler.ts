import { Inject } from "@nestjs/common";
import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { DeleteSessionCommand } from "./delete-session.command";

import type { IActiveMultiplayerSessionRepository, IPinRepository } from "src/multiplayer-sessions/domain/ports";

import { Either } from '../../../../core/types/either';

import { FileSystemPinRepository } from "src/multiplayer-sessions/infrastructure/adapters/file-system.pin.repository";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import { ErrorData, ErrorLayer } from "src/core/types";
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { DeleteSessionContext } from "../context/session-resources.context.interface";

// Este caso de uso es utilizado para borrar una sesion que pudo haber quedado en memoria tras finalizar una sesion de manera repentina
@CommandHandler( DeleteSessionCommand )
export class DeleteSessionHandler implements ICommandHandler<DeleteSessionCommand> {


    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,


        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
        private readonly logger: ILogger,

        @Inject( FileSystemPinRepository )
        private readonly pinRepository: IPinRepository,
    ){}


    @Log()
    async execute(command: DeleteSessionCommand): Promise<Either<ErrorData, boolean>> {

        // Contexto para logs
        const appContext = createMultiplayerSessionAppContext('deleteSession', undefined, undefined, command.sessionPin);

        return pipeAsync<ErrorData, boolean>(
            
            // 1. INICIO
            Either.makeRight(command),

            // 2. LIBERAR PIN (Side Effect)
            // Lo hacemos primero para asegurar que el PIN quede libre sí o sí.
            cmd => cmd.chainAsync(c => this.releasePinStep(c)),

            // 3. BORRAR SESIÓN (Lógica Condicional)
            // Busca y borra si existe.
            ctx => ctx.chainAsync(c => this.processSessionDeletion(c)),

            // 4. RESPUESTA
            ctx => ctx.map(c => c.wasDeleted),

            // 5. ERRORES
            result => result.mapLeft(err => err.setContext(appContext))
        );
    }

    // --- MÉTODOS PRIVADOS ---

    /**
     * Paso 2: Liberar el PIN
     * Intentamos liberar el PIN. Si falla, decidimos si es crítico o no.
     * Generalmente, si no se puede liberar el PIN, es un error del sistema.
     */
    private async releasePinStep(
        command: DeleteSessionCommand
    ): Promise<Either<ErrorData, DeleteSessionContext>> {
        try {
            // Asumo que releasePin podría ser async en un futuro (DB real)
            await this.pinRepository.releasePin(command.sessionPin);
            
            // Inicializamos el contexto con wasDeleted en false por defecto
            return Either.makeRight({
                command,
                wasDeleted: false
            });
        } catch (error) {
            // Usamos el helper seguro que discutimos antes
            return Either.makeLeft(new ErrorData( "Pin Liberation Error", error.message, ErrorLayer.APPLICATION ));
        }
    }

    /**
     * Paso 3: Procesar el borrado de la sesión
     * Encapsula la lógica de "Buscar -> Verificar -> Borrar"
     */
    private async processSessionDeletion(
        ctx: DeleteSessionContext
    ): Promise<Either<ErrorData, DeleteSessionContext>> {
        const { command } = ctx;

        try {
            // 1. Buscamos si existe (usamos findByPin normal o Either, aquí el normal es más cómodo)
            // Nota: Si tu repo findByPin devuelve null cuando no existe:
            const sessionWrapper = await this.sessionRepository.findByPin(command.sessionPin);

            // 2. Si no existe, no hacemos nada y retornamos éxito (idempotencia)
            if (!sessionWrapper) {
                return Either.makeRight({ ...ctx, wasDeleted: false });
            }

            // 3. Si existe, la borramos
            await this.sessionRepository.deleteSession(command.sessionPin);

            // 4. Retornamos que sí hubo borrado
            return Either.makeRight({ ...ctx, wasDeleted: true });

        } catch (error) {
            return Either.makeLeft(new ErrorData( "Delete Error", error.message, ErrorLayer.APPLICATION ));
        }
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