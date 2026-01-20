/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\save-session\save-session.handler.ts

import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { SaveSessionCommand } from "./save-session.command";

import type { IActiveMultiplayerSessionRepository, IMultiplayerSessionHistoryRepository, IPinRepository } from "src/multiplayer-sessions/domain/ports";
import { SessionArchiverService } from "src/multiplayer-sessions/domain/domain-services";

import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { Either } from '../../../../core/types/either';

import { COMMON_ERRORS } from "../context/errors/common.errors";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";

// Este caso de uso será utilizado cuando el host decida finalizar la partida antes de que se hayan mostrado todas las preguntas
// Corresponde a un evento en la ws api que aún no se implementa
@CommandHandler( SaveSessionCommand )
export class SaveSessionHandler implements ICommandHandler<SaveSessionCommand> {

    private readonly sessionArchiverService: SessionArchiverService;

    constructor(
        @Inject(RepositoryName.MultiplayerSession)
        private readonly sessionSavingRepository: IMultiplayerSessionHistoryRepository,
        @Inject( APPLICATION_CORE_TOKENS.UTILS.ACTIVE_SESSION_REPO)
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,
    ){
        this.sessionArchiverService = new SessionArchiverService(
            this.sessionSavingRepository,
        );
    }

    async execute(command: SaveSessionCommand): Promise<Either<Error, boolean >> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

            const { session, kahoot } = sessionWrapper;

            // Procesamos la limpieza y archivado de la sesión
            // Aqui no liberamos el pin, esperamos a que el host cierre la sesion por completo para eso
            await this.sessionArchiverService.archiveSession( session, kahoot );

            // Respuesta guardada con exito
            return Either.makeRight( true );
   
        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}