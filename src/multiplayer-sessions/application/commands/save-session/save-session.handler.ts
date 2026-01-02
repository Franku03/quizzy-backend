import { Inject } from "@nestjs/common";
import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { COMMON_ERRORS } from "../common.errors";
import { SaveSessionCommand } from "./save-session.command";

import type { IActiveMultiplayerSessionRepository, IMultiplayerSessionHistoryRepository } from "src/multiplayer-sessions/domain/ports";
import { SessionArchiverService } from "src/multiplayer-sessions/domain/domain-services";

import { Either } from '../../../../core/types/either';
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";

// Este caso de uso es utilizado cuando el host decide finalizar la partida antes de que se hayan mostrado todas las preguntas
@CommandHandler( SaveSessionCommand )
export class SaveSessionHandler implements ICommandHandler<SaveSessionCommand> {

    private readonly sessionArchiverService: SessionArchiverService;

    constructor(
        @Inject(RepositoryName.MultiplayerSession)
        private readonly sessionSavingRepository: IMultiplayerSessionHistoryRepository,
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,
    ){
        this.sessionArchiverService = new SessionArchiverService(
            this.sessionSavingRepository,
            this.sessionRepository
        );
    }

    async execute(command: SaveSessionCommand): Promise<Either<Error, boolean >> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

            const { session } = sessionWrapper;

            // Procesamos la limpieza y archivado de la sesión
            await this.sessionArchiverService.archiveAndClean( session );

            // Respuesta guardada con exito
            return Either.makeRight( true );
   
        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}