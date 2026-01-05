import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { HostStartGameCommand } from "./host-start-game.command";
import { COMMON_ERRORS } from "../common.errors";
import { QuestionStartedResponse } from "../../response-dtos/question-started.response.dto";

import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";
import { mapToQuestionResponse } from "../../mappers";

import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Either } from '../../../../core/types/either';




@CommandHandler( HostStartGameCommand )
export class HostStartGameHandler implements ICommandHandler<HostStartGameCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        private readonly mediaService: MediaEnrichmentService,
    ){}

    async execute(command: HostStartGameCommand): Promise<Either<Error, QuestionStartedResponse>> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );


            const { session, kahoot } = sessionWrapper
            
            // Iniciamos la partida
            session.startSession(); // Pasa a estado question automaticamente

            // Mapeamos la slide actual (la primera) a formato de opciones sin mostrar la respuesta correcta, y obtenemos directamente los datos de la respuesta a dar
            const res = await mapToQuestionResponse( session, kahoot, this.mediaService );

            // Creamos la tabla de resultados para la primera slide
            session.startSlideResults( new SlideId( res.data.currentSlideData.id ) );

            return Either.makeRight( res );
   
        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}