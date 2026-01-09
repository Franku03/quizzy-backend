import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.styling";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";

export interface SessionResourcesForCreation {

    // Pasos iniciales, indispensables
    kahoot: Kahoot,
    pin: string,
    sessionId: string,
    // Pasos de la cadena, requeridos para formar la response final y hacer menos llamadas innecesarias
    session?: MultiplayerSession
    styling?: KahootStylingSnapshot
    quizTitle?: string,
    qrToken?: string


}