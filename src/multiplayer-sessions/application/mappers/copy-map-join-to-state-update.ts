import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { Player } from "src/multiplayer-sessions/domain/entity/session.player";
import { GameStateUpdateResponse } from "../response-dtos/game-state-update.response.dto";


export const mapJoinToStateUpdate = ( player: Player, session: MultiplayerSession, kahoot: Kahoot): GameStateUpdateResponse => {

    // Construimos la response del game_state_update

    const state = session.getSessionStateType();
    const players = session.getPlayers().map( player => ({
        
        playerId: player.getPlayerId(),
        nickname: player.getPlayerNickname(),

    }));


    // TODO: Hacer condiciones de qué devolver en el estado si el jugador que se une se está reconectando a la partida
    // ? const currentSlideData = kahoot.getNextSlideSnapshotByIndex()!; // Aqui todavia no devolvemos info del slide

    return {

        hostLobbyUpdate: {

            state: state,
            players: players,
            numberOfPlayers: players.length,

        },

        playerStateUpdate: {

            connected: true,
            state: state,
            nickname: player.getPlayerNickname(),
            score: player.getScore(),

        }

        // ? currentSlideData: currentSlideData,
    }; 



};