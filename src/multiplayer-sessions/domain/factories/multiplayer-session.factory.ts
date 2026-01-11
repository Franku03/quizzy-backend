import { MultiplayerSession } from "../aggregates/multiplayer-session";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";

import { MultiplayerSessionId } from "src/core/domain/shared-value-objects/id-objects/multiplayer-session.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id"
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id"
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";

import { Scoreboard, SessionPin, SessionState, SessionProgress, PlayerId, SlideResult } from "../value-objects"
import { Player } from "../entity/session.player";
import { Optional } from "src/core/types/optional";
import { DateISO } from "src/core/domain/shared-value-objects/value-objects/value.object.date";

import { PlayerIdValue, SlideIdValue } from "../types/id-value.types";
import { Either, ErrorData } from "src/core/types";

interface KahootInfo {
    kahootId: KahootId,
    firstSlideId: SlideId,
    slidesNumber: number
}

export class MultiplayerSessionFactory {


    public static createMultiplayerSession( 
        kahoot: Kahoot,
        hostIdString: string,  // UserId
        sessionIdString: string, // MultiplayerSessionId
        pin: string,
        // pinGenerationService: IGeneratePinService,
        // pinVerificationService: IVerifyAvailablePinService,
    ): Either<ErrorData,MultiplayerSession> {

        // Lógica de creación de la info del kahoot
        // Creamos el idUser del host y verificamos que el kahoot le corresponda
        const hostId = new UserId( hostIdString );

        // Obtenemos la informacion del kahoot necesaria para construir el player session
        const slideId = new SlideId( kahoot.getNextSlideSnapshotByIndex()?.id! )

        const kahootInfo: KahootInfo = {
            kahootId: kahoot.id,
            firstSlideId: slideId,
            slidesNumber: kahoot.hasHowManySlides(),
        }

        const sessionId = new MultiplayerSessionId( sessionIdString );

        const sessionPinResult = SessionPin.create( pin );

        // Retornamos error en caso de pin inválido
        if( sessionPinResult.isLeft() )
            return Either.makeLeft( sessionPinResult.getLeft() );

        const initialGameState = SessionState.createAsLobby();

        const ranking = Scoreboard.create();

        const initialSessionProgress = SessionProgress.create( 
            kahootInfo.firstSlideId , 
            new Optional(), // no tiene slide previa al inicio
            kahootInfo.slidesNumber, 
            0 
        );

        const hollowPlayerMap = new Map<PlayerIdValue, Player>();

        const hollowAnswersMap = new Map<SlideIdValue, SlideResult>();

        const startedAt = DateISO.generate();

        const hollowCompletedAt = new Optional<DateISO>(); // Creamos optional vacio, luego lo cambiaremos por uno que tenga info, la unica razon para el optional es para no trabajar directamente con null en el agregado

        const hollowCurrentQuestionStartTime = new Date();

        const session = new MultiplayerSession({
            hostId: hostId,
            kahootId: kahootInfo.kahootId,
            sessionPin: sessionPinResult.getRight(), // Si llegamos aca sabemos que el pin es válido
            startedAt: startedAt,
            completedAt: hollowCompletedAt, 
            currentQuestionStartTime: hollowCurrentQuestionStartTime, // Por defecto 0
            sessionState: initialGameState,
            ranking: ranking,
            progress: initialSessionProgress,
            players: hollowPlayerMap,
            playersAnswers: hollowAnswersMap
        }, sessionId );

        // creación exitosa
        return Either.makeRight( session );

    }


}