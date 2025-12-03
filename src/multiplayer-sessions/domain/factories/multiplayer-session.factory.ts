import { MultiplayerSession } from "../aggregates/multiplayer-session";

import { MultiplayerSessionId } from "src/core/domain/shared-value-objects/id-objects/multiplayer-session.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id"
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id"
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";

import { Scoreboard, SessionPin, SessionState, SessionProgress, PlayerId, SlideResult } from "../value-objects"
import { Player } from "../entity/session.player";
import { Optional } from "src/core/types/optional";
import { DateISO } from "src/core/domain/shared-value-objects/value-objects/value.object.date";

import { PlayerIdValue, SlideIdValue } from "../types/id-value.types";

interface KahootInfo {
    kahootId: KahootId,
    firstSlideId: SlideId,
    slidesNumber: number
}

export class MultiplayerSessionFactory {


    public static createMultiplayerSession( 
        kahootInfo: KahootInfo,
        hostId: UserId,
        sessionId: MultiplayerSessionId,
        pin: string,
        // pinGenerationService: IGeneratePinService,
        // pinVerificationService: IVerifyAvailablePinService,
    ): MultiplayerSession {


        const sessionPin = SessionPin.create( pin );

        const initialGameState = SessionState.createAsLobby();

        const ranking = Scoreboard.create();

        const initialSessionProgress = SessionProgress.create( kahootInfo.firstSlideId , kahootInfo.slidesNumber, 0 );

        const hollowPlayerMap = new Map<PlayerIdValue, Player>();

        const hollowAnswersMap = new Map<SlideIdValue, SlideResult>();

        const startedAt = DateISO.generate();

        const hollowCompletedAt = new Optional<DateISO>(); // Creamos optional vacio, luego lo cambiaremos por uno que tenga info, la unica razon para el optional es para no trabajar directamente con null en el agregado


        return new MultiplayerSession({
            hostId: hostId,
            kahootId: kahootInfo.kahootId,
            sessionPin: sessionPin,
            startedAt: startedAt,
            completedAt: hollowCompletedAt, 
            sessionState: initialGameState,
            ranking: ranking,
            progress: initialSessionProgress,
            players: hollowPlayerMap,
            playersAnswers: hollowAnswersMap
        }, sessionId );

    }


}