import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InMemorySessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import { JoinPlayerCommand } from './join-player.command';
import { COMMON_ERRORS } from "../common.errors";
import { GameStateUpdateResponse } from "../../response-dtos/game-state-update.response.dto";


import { PlayerFactory } from "src/multiplayer-sessions/domain/factories/player.factory";
import { PlayerId } from "src/multiplayer-sessions/domain/value-objects";
import { Either } from '../../../../core/types/either';




@CommandHandler( JoinPlayerCommand )
export class JoinPlayerHandler implements ICommandHandler<JoinPlayerCommand> {

    constructor(
        @Inject( InMemorySessionRepository )
        private readonly sessionRepository: InMemorySessionRepository,
    ){}

    async execute(command: JoinPlayerCommand): Promise<Either<Error, GameStateUpdateResponse>> {


        try {
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

            if( !sessionWrapper )
                return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );


            const { session, kahoot } = sessionWrapper

            // TODO: Aqui habria que verificar si el id del jugador corresponde a algun usuario, habria que inyectar el repo de users

            const playerId = new PlayerId( command.userId );

            const player = PlayerFactory.createPlayerFromExistingUser( playerId, command.nickname );

            session.joinPlayer( player );

            // Construimos la response del game_state_update
            const hostId = session.getHostId().value;
            const state = session.getSessionState();
            const players = session.getPlayers().map( player => ({
                
                playerId: player.getPlayerId(),
                nickname: player.getPlayerNickname(),

            }));

            const kahootDetails = kahoot.details.getValue();

            const quizTitle = kahootDetails.title.hasValue() ? kahootDetails.title.getValue() : undefined;

            const kahootImageId = kahoot.styling.imageId.hasValue() ? kahoot.styling.imageId.getValue().value : undefined;

            const kahootThemeId = kahoot.styling.themeName;

            const currentSlideData = kahoot.getNextSlideSnapshotByIndex()!;

            return Either.makeRight({
                hostId: hostId, 
                state: state,
                players: players,
                quizTitle: quizTitle, // No siempre hara falta pasar esto en un GameStateUpdate
                quizMediaUrls: { ImageUrl: kahootImageId, ThemeUrl: kahootThemeId }, // No siempre hara falta pasar esto en un GameStateUpdte
                currentSlideData: currentSlideData,
            }); 

        } catch (error) {

            return Either.makeLeft( error );

        }

    }

}