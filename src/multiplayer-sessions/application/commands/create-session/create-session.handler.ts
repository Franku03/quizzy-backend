import { Inject } from "@nestjs/common";

import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";
import { CreateSessionCommand } from "./create-session.command";

import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import type { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
import type { IGeneratePinService } from "src/multiplayer-sessions/domain/domain-services";
import type { IdGenerator } from "src/core/application/ports/idgenerator/i-id-generator.interface";
import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";

import { MultiplayerSessionFactory } from "src/multiplayer-sessions/domain/factories/multiplayer-session.factory";
import { UuidGenerator } from "src/core/infrastructure/adapters/idgenerator/uuid-generator";
import { CryptoGeneratePinService } from "src/multiplayer-sessions/infrastructure/adapters/crypto-generate-pin";
import { CreateSessionResponse } from "../../response-dtos/create-session.response.dto";
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";
import { Either } from '../../../../core/types/either';


import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { CREATE_SESSION_ERRORS } from "./create-session.errors";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";


@CommandHandler( CreateSessionCommand )
export class CreateSessionHandler implements ICommandHandler<CreateSessionCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject( RepositoryName.Kahoot )
        private readonly kahootRepository: IKahootRepository,

        @Inject( UuidGenerator )
        private readonly IdGenerator: IdGenerator<string>,

        @Inject( CryptoGeneratePinService )
        private readonly sessionPinGenerator: IGeneratePinService,
    
        private readonly mediaService: MediaEnrichmentService,

        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
    ){}

    @Log()
    async execute(command: CreateSessionCommand): Promise<Either<Error,CreateSessionResponse>> {


        try {
            
            // Cargamos el agregado kahoot desde el repositorio

            const searchedKahoot = await this.kahootRepository.findKahootByIdEither( command.kahootId );


            if( searchedKahoot.isLeft() ){

                const error = searchedKahoot.getLeft();
                return Either.makeLeft(error);

            }
                    
            const kahoot = searchedKahoot.getRight()

            if( !kahoot ){

                const error = DomainErrorFactory.notFound(
                    {
                        domainObjectType: 'Kahoot',
                        domainObjectId: command.kahootId,
                        actorId: command.hostId,
                        intendedAction: 'Create multiplayer session for a Kahoot',
                        operation: 'CreateSessionHandler.execute',
                    },
                    CREATE_SESSION_ERRORS.KAHOOT_NOT_FOUND
                );

                return Either.makeLeft(error);

            }

            // TODO: mover esta validación aL ASPECT cuando esté implementado
            // Obtenemos el IDuser del host y verificamos que el kahoot le corresponda en caso de ser privado, y que el kahoot no esté en draft
            const hostIdString = command.hostId

            // Regla 1: No se puede jugar si es Draft
            if( kahoot.isDraft() )
                return Either.makeLeft( new Error(CREATE_SESSION_ERRORS.KAHOOT_IS_DRAFT) );

            // Regla 2: Si es privado, solo el autor puede hostearlo
            if( kahoot.isPrivate() && !(command.hostId === kahoot.authorId) )
                return Either.makeLeft( new Error(CREATE_SESSION_ERRORS.USER_UNAUTHORIZED) );

            // Creamos el id de la sesion y para que la fábrica construya el VO del id de la sesión en base al mismo
            const sessionIdString = await this.IdGenerator.generateId();

            // Generamos el Pin de la sesion
            const pin = await this.sessionPinGenerator.generateUniquePin();

            const session = MultiplayerSessionFactory.createMultiplayerSession(
                kahoot,
                hostIdString,
                sessionIdString,
                pin
            )


            const kahootSnapshot = kahoot.getSnapshot();

            const enrichedSessionStyling = await this.mediaService.enrichStyling( kahootSnapshot.styling );

            // Guardamos la sesion en el repositorio de sesiones activas y obtenemos el token QR
            const qrToken = await this.sessionRepository.saveSession({
                session,
                kahoot,
                sessionStyling: enrichedSessionStyling
            });

            return Either.makeRight({ 
                sessionPin: pin, 
                qrToken: qrToken,
                quizTitle: kahootSnapshot.details?.title || 'Untitled Quiz',
                coverImageUrl: enrichedSessionStyling.imageId || '',
                theme: enrichedSessionStyling.theme || { id: '', url: '', name: ''},
            }); 

        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}