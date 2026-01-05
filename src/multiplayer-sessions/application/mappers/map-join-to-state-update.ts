import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { Player } from "src/multiplayer-sessions/domain/entity/session.player";
import { GameStateUpdateResponse } from "../response-dtos/game-state-update.response.dto";
import { mapHostLobbyData, mapPlayerLobbyData } from "../helpers";


export const mapJoinToStateUpdate = ( player: Player, session: MultiplayerSession, kahoot: Kahoot): GameStateUpdateResponse => {

    // Construimos la response del game_state_update
     
    // mapeamos la respuesta para el host
    const hostData = mapHostLobbyData( session );

    // mapeamos la respuesta para el player
    const playerData = mapPlayerLobbyData( session, player.getPlayerId() );


    // TODO: Hacer condiciones de qué devolver en el estado si el jugador que se une se está reconectando a la partida
    // ? const currentSlideData = kahoot.getNextSlideSnapshotByIndex()!; // Aqui todavia no devolvemos info del slide

    return {

        hostLobbyUpdate: hostData,

        playerStateUpdate: playerData
        // ? currentSlideData: currentSlideData,
    }; 



};