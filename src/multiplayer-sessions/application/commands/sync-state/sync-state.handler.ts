import { Inject } from "@nestjs/common";
import { ICommandHandler } from "src/core/application/cqrs";
import { CommandHandler } from "src/core/infrastructure/cqrs";

import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";

import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";
import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";

import { SyncStateCommand } from "./sync-state.command";
import { QuestionAdditionalData, SyncStateResponse } from "../../response-dtos/sync-state.response.dto";
import { SyncData } from "../../response-dtos";
import { mapEndToSyncState, mapLobbyToSyncState, mapQuestionToSyncState, mapResultsToSyncState, mapToQuestionResponse } from "../../mappers";

import { Either } from "src/core/types";

import { COMMON_ERRORS } from "../common.errors";


@CommandHandler( SyncStateCommand )
export class SyncStateHandler implements ICommandHandler<SyncStateCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        private readonly mediaService: MediaEnrichmentService,
    ){}

    async execute(
        command: SyncStateCommand
    ): Promise<Either<Error, SyncStateResponse>> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

            const { session, kahoot } = sessionWrapper

            const state = session.getSessionState();


            switch( state.getActualState() ) {


                case( SessionStateType.LOBBY ): {

                    const res = mapLobbyToSyncState( session, command );
                    return Either.makeRight( res );
                    
                }

                case( SessionStateType.QUESTION ): {

                    const question = await mapToQuestionResponse( session, kahoot, this.mediaService );
                    const res = mapQuestionToSyncState( session, kahoot, question, command );
                    
                    return Either.makeRight( res );

                }

                case( SessionStateType.RESULTS ): {

                    const res = mapResultsToSyncState( session, kahoot, command );
                    return Either.makeRight( res );

                }

                case( SessionStateType.END ): {

                    const res = mapEndToSyncState( session, command );
                    return Either.makeRight(res);

                }

            }

   

        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}