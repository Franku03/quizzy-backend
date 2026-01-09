import { Inject } from "@nestjs/common";
import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { DeleteSessionCommand } from "./delete-session.command";

import type { IActiveMultiplayerSessionRepository, IPinRepository } from "src/multiplayer-sessions/domain/ports";

import { Either } from '../../../../core/types/either';

import { FileSystemPinRepository } from "src/multiplayer-sessions/infrastructure/adapters/file-system.pin.repository";

// Este caso de uso es utilizado para borrar una sesion que pudo haber quedado en memoria tras finalizar una sesion de manera repentina
@CommandHandler( DeleteSessionCommand )
export class DeleteSessionHandler implements ICommandHandler<DeleteSessionCommand> {


    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject( FileSystemPinRepository )
        private readonly pinRepo: IPinRepository,
    ){}

    async execute(command: DeleteSessionCommand): Promise<Either<Error, boolean>> {


        try {

            const { sessionPin } = command;

            // * Eliminamos el pin del txt para liberarlo, aqui finalmente se hace la sesión completamente inválida
            this.pinRepo.releasePin( sessionPin );

            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( sessionPin );

            // Si no encontramos sesion en memoria no pasa nada, devolvemos false para decir que no hizo falta borrar la sesion
            if( !sessionWrapper )
                return Either.makeRight( false );

            // Procesamos la limpieza de la session
            this.sessionRepository.delete( sessionPin );
            

            // Habia una sesion por borrar y regresamos true para decir que ya fue liberada de memoria
            return Either.makeRight( true );
   
        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}