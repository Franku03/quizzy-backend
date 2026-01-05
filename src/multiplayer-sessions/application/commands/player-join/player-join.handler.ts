import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { PlayerFactory } from "src/multiplayer-sessions/domain/factories/player.factory";

import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";
import { Either } from '../../../../core/types/either';

import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";
import type { IUserDao } from "src/users/application/queries/ports/users.dao.port";

import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";

import { mapJoinToStateUpdate } from "../../mappers";
import { PlayerJoinCommand } from './player-join.command';
import { GameStateUpdateResponse } from "../../response-dtos/game-state-update.response.dto";
import { COMMON_ERRORS } from "../common.errors";


@CommandHandler( PlayerJoinCommand )
export class PlayerJoinHandler implements ICommandHandler<PlayerJoinCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject(DaoName.User) // Inyectamos el DAO usando el Token del Catálogo
        private readonly usersDao: IUserDao,

        private readonly mediaService: MediaEnrichmentService,
    ){}

    async execute(command: PlayerJoinCommand): Promise<Either<Error, GameStateUpdateResponse>> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

            const { session, kahoot } = sessionWrapper



            // Buscamos el usuario que se quiere unir (si es que existe), de no ser asi lo unimos a la partida como invitado
            const result = await this.usersDao.getUserById(command.userId);
 
            const player = PlayerFactory.createPlayerForSession( 
                result.hasValue() ? result.getValue().id : command.userId, // Si no se encontro el usuario, pasamos el id que viene del JWT de invitado
                command.nickname, 
                !result.hasValue() // Si no se encontro el usuario, es un invitado
            );

            // Unimos el jugador a la partida
            // TODO: Devolver un error si la partida ya no permite conectar usuarios, si estamos en lobby, igual eso se hara toggle una vez empiece
            session.joinPlayer( player );

            const res = mapJoinToStateUpdate(player, session, kahoot);

            // const enrichedRes = await this.mediaService.enrichSlide( res.playerStateUpdate.currentSlideData!);

            return Either.makeRight( res ); 

        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}