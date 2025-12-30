import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { Player } from "src/multiplayer-sessions/domain/entity/session.player";
import { GameStateUpdateResponse } from "../response-dtos/game-state-update.response.dto";


export const mapJoinToStateUpdate = ( player: Player, session: MultiplayerSession, kahoot: Kahoot): GameStateUpdateResponse => {

    // Construimos la response del game_state_update

    const hostId = session.getHostId().value;
    const state = session.getSessionStateType();
    const players = session.getPlayers().map( player => ({
        
        playerId: player.getPlayerId(),
        nickname: player.getPlayerNickname(),

    }));

    const kahootDetails = kahoot.details.getValue();

    const quizTitle = kahootDetails.title.hasValue() ? kahootDetails.title.getValue() : undefined;

    const kahootImageId = kahoot.styling.imageId.hasValue() ? kahoot.styling.imageId.getValue().value : undefined;

    const kahootThemeId = kahoot.styling.themeName;


    // TODO: Hacer condiciones de qué devolver en el estado si el jugador que se une se está reconectando a la partida
    // TODO: Utilizar el enricher cuando exista para poblar las Imagenes con las URLs correspondientes
    // ? const currentSlideData = kahoot.getNextSlideSnapshotByIndex()!; // Aqui todavia no devolvemos info del slide

    return {
        hostId: hostId, 
        state: state,
        players: players,
        quizTitle: quizTitle, // No siempre hara falta pasar esto en un GameStateUpdate
        quizMediaURLs: { imageURL: kahootImageId, themeURL: kahootThemeId } // No siempre hara falta pasar esto en un GameStateUpdte
        // ? currentSlideData: currentSlideData,
    }; 



};