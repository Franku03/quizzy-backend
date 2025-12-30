import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { COMMON_ERRORS } from "../common.errors";
import { HOST_NEXT_PHASE_ERRORS } from "./host-next-phase.errors";


import { HostNextPhaseCommand } from "./host-next-phase.command";
import { HostNextPhaseResponse } from '../../response-dtos/types/host-next-phase-response.type';

import { StateTransitionsTypes } from "src/multiplayer-sessions/domain/types";
import { SessionArchiverService, UpdateSessionProgressAndRankingService } from "src/multiplayer-sessions/domain/domain-services";
import type { IActiveMultiplayerSessionRepository, IMultiplayerSessionHistoryRepository } from "src/multiplayer-sessions/domain/ports";

import { mapEntriesToResultsResponse, mapFinalScoreboard, mapSnapshotsToQuestionResponse } from "../../mappers";

import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { Either } from '../../../../core/types/either';

@CommandHandler( HostNextPhaseCommand )
export class HostNextPhaseHandler implements ICommandHandler<HostNextPhaseCommand> {

    private readonly updateProgressAndRankingService: UpdateSessionProgressAndRankingService;
    private readonly sessionArchiverService: SessionArchiverService;

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject(RepositoryName.MultiplayerSession)
        private readonly sessionSavingRepository: IMultiplayerSessionHistoryRepository,
    ){
        this.updateProgressAndRankingService = new UpdateSessionProgressAndRankingService();

        this.sessionArchiverService = new SessionArchiverService(
            this.sessionSavingRepository,
            this.sessionRepository
        )
    }

    async execute(command: HostNextPhaseCommand): Promise<Either<Error, HostNextPhaseResponse >> {

        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

            const { session, kahoot } = sessionWrapper


            // 1) Lógica previa (Cálculo de puntajes)
            // Solo necesitamos calcular puntajes si estamos SALIENDO de una pregunta ( QUESTION -> RESULTS )
            if( session.getSessionState().isQuestion() ){

                this.updateProgressAndRankingService.updateSessionProgressAndRanking( kahoot, session );
                
            }

            // 2) transicionar el estado de la sesión, el agregado se encarga de validar la transición
            const transitionResult = session.advanceToNextPhase();

            // 3) Mapear la respuesta según el estado correspondiente
            switch ( transitionResult.state ) {
                case StateTransitionsTypes.TRANSITION_TO_QUESTION:
                    {
                        const response = mapSnapshotsToQuestionResponse( session, kahoot );
                        return Either.makeRight( response );
                    }

                case StateTransitionsTypes.TRANSITION_TO_RESULTS:
                    {
                        const response = mapEntriesToResultsResponse( session, kahoot );
                        return Either.makeRight( response );
                    }

                case StateTransitionsTypes.TRANSITION_TO_END:
                    {
                        try {

                            // Guardamos la partida en persistencia y limpiamos recursos
                            await this.sessionArchiverService.archiveAndClean( session );
                            // Mapear la respuesta de fin de juego          
                            const response = mapFinalScoreboard( session, kahoot );
                            return Either.makeRight(response);

                        } catch (error) {
                            // Si falla el guardado, podemos decidir qué hacer. Es Lo ideal: Retornar Error (Left) para que el controller lo sepa y el estado en memoria siga sucio pero recuperable
                            return Either.makeLeft(new Error("Error crítico guardando la partida: " + error.message));
                        }

                    }

                default:
                    return Either.makeLeft( new Error(HOST_NEXT_PHASE_ERRORS.SESSION_INVALID_STATE) );
                
            }

        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}