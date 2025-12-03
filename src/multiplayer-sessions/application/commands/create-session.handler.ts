import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateSessionCommand } from "./create-session.command";

import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { InMemorySessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/InMemorySessionRepository";

import type { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { MultiplayerSessionFactory } from "src/multiplayer-sessions/domain/factories/multiplayer-session.factory";


@CommandHandler( CreateSessionCommand )
export class CreateSessionHandler implements ICommandHandler<CreateSessionCommand> {

    constructor(
        @Inject( InMemorySessionRepository )
        private readonly sessionRepository: InMemorySessionRepository,

        @Inject( RepositoryName.Kahoot )
        private readonly kahootRepository: IKahootRepository,
    ){}

    async execute(command: CreateSessionCommand): Promise<void> {

        // // Cargamos el agregado kahoot desde el repositorio
        // const tempKahootId = new KahootId( command.kahootId );

        // const kahootOpt = await this.kahootRepository.findKahootById( tempKahootId );

        // if( !kahootOpt.hasValue() )
        //     throw new Error("El Kahoot solicitado no existe"),



        // // const session = MultiplayerSessionFactory.createMultiplayerSession({
            

        // // })

        // // await this.sessionRepository.save({});

        // return new Promise()
    }

}