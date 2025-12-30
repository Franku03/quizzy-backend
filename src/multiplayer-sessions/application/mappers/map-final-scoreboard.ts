import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";

import { GameEndedResponse } from "../response-dtos/game-ended.response.dto";
import { HostNextPhaseType } from "../response-dtos/enums/host-next-phase-type.enum";

import { mapEntriesToResultsResponse } from "./map-entries-to-scoreboard";

export const mapFinalScoreboard = ( session: MultiplayerSession, kahoot: Kahoot, previousSlideId: SlideId ): GameEndedResponse => {

    const { playerScoreboard, state } = mapEntriesToResultsResponse( session, kahoot, previousSlideId ).data;
    
    const response: GameEndedResponse = {
        type: HostNextPhaseType.GAME_END,
        data: {
            state: state,
            finalScoreboard: playerScoreboard,
            winnerNickname: playerScoreboard[0]?.nickname,
        }
    };  

    return response;
}