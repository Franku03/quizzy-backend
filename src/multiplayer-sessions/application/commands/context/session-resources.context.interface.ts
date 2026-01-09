import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.styling";

import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { Player } from "src/multiplayer-sessions/domain/entity/session.player";

import { ActiveSessionContext } from "src/multiplayer-sessions/domain/ports";
import { PlayerJoinCommand } from "../player-join/player-join.command";

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


export interface SessionResourcesForPlayerJoin {

    // Indispensable todo el flujo
    sessionCtx: ActiveSessionContext,
    command: PlayerJoinCommand,

    // Se adjunta al final
    player?: Player,

}