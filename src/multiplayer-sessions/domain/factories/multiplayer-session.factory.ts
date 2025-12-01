import { MultiplayerSession } from "../aggregates/multiplayer-session";

import { MultiplayerSessionId } from "src/core/domain/shared-value-objects/id-objects/multiplayer-session.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id"
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id"
import { IGeneratePinService, IVerifyAvailablePinService } from "../domain-services"
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";

import { Scoreboard, SessionPin, SessionState, SessionProgress, PlayerId, SlideResult } from "../value-objects"
import { Player } from "../entity/session.player";

interface SlideInfo {
    firstSlideId: SlideId,
    slidesNumber: number
}

export class MultiplayerSessionFactory {


    public static createMultiplayerSession( 
        kahootId: KahootId,
        slidesInfo: SlideInfo, 
        hostId: UserId,
        sessionId: MultiplayerSessionId,
        pinGenerationService: IGeneratePinService,
        pinVerificationService: IVerifyAvailablePinService,
    ): MultiplayerSession {


        const sessionPin = SessionPin.create( pinVerificationService, pinGenerationService );

        const initialGameState = SessionState.createAsLobby();

        const ranking = Scoreboard.create();

        const initialSessionProgress = SessionProgress.create( slidesInfo.firstSlideId , slidesInfo.slidesNumber, 0 );

        const hollowPlayerMap = new Map<PlayerId, Player>();

        const hollowAnswersMap = new Map<SlideId, SlideResult>();


        return new MultiplayerSession({
            hostId: hostId,
            kahootId: kahootId,
            sessionPin: sessionPin,
            startedAt: new Date(),
            sessionState: initialGameState,
            ranking: ranking,
            progress: initialSessionProgress,
            players: hollowPlayerMap,
            playersAnswers: hollowAnswersMap
        }, sessionId );

    }


}