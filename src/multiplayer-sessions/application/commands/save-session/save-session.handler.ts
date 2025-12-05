import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InMemorySessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import { COMMON_ERRORS } from "../common.errors";
import { SaveSessionCommand } from "./save-session.command";

import type { IMultiplayerSessionRepository, IPinRepository } from "src/multiplayer-sessions/domain/ports";

import { Either } from '../../../../core/types/either';
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { FileSystemPinRepository } from "src/multiplayer-sessions/infrastructure/adapters/file-system.pin.repository";


@CommandHandler( SaveSessionCommand )
export class SaveSessionHandler implements ICommandHandler<SaveSessionCommand> {


constructor(
        @Inject(RepositoryName.MultiplayerSession)
        private readonly sessionSavingRepository: IMultiplayerSessionRepository,
        @Inject( InMemorySessionRepository )
        private readonly sessionRepository: InMemorySessionRepository,
        // @Inject( FileSystemPinRepository )
        // private readonly fileSystemRepo: IPinRepository
    ){}

    async execute(command: SaveSessionCommand): Promise<Either<Error, boolean >> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

            const { session } = sessionWrapper;

            // validamos que todo este en orden antes de guardar y que no hayan inconsistencia
            session.validateAllInvariantsForCompletion();

            // TODO: Hacer mapeo de monadas Either desde la respuesta del saveSession
            await this.sessionSavingRepository.saveSession( session );

            // Liberamos el recurso de memoria y tambien el pin del txt
            await this.sessionRepository.delete( command.sessionPin );

            // ? No hace falta pues ya lo hacemos en el repositorio en memoria
            // await this.fileSystemRepo.releasePin( command.sessionPin );

            // Respuesta guardada con exita
            return Either.makeRight( true );
   
        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}