/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\context\session-resources.context.interface.ts

import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.styling";

import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { Player } from "src/multiplayer-sessions/domain/entity/session.player";

import { ActiveSessionContext } from "src/multiplayer-sessions/domain/ports";
import { PlayerJoinCommand } from "../player-join/player-join.command";
import { PlayerSubmitAnswerCommand } from "../player-submit-answer/player-submit-answer.command";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { Submission } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { HostStartGameCommand } from "../host-start-game/host-start-game.command";
import { HostNextPhaseResponse, QuestionStartedResponse, SyncStateResponse } from "../../response-dtos";
import { HostNextPhaseCommand } from "../host-next-phase/host-next-phase.command";
import { StateTransitionsTypes } from "src/multiplayer-sessions/domain/types";
import { SyncStateCommand } from "../sync-state/sync-state.command";
import { DeleteSessionCommand } from "../delete-session/delete-session.command";

// * Create Session
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

//* PlayerJoin
export interface SessionResourcesForPlayerJoin {

    // Indispensable todo el flujo
    sessionCtx: ActiveSessionContext,
    command: PlayerJoinCommand,

    // Se adjunta al final
    player?: Player,

}

// * PlayerSubmitAnswer
export interface PlayerSubmitContextWithSession {
    command: PlayerSubmitAnswerCommand;
    sessionCtx: ActiveSessionContext; // Trae session y kahoot
}

export interface PlayerSubmitContextWithSlide {
    command: PlayerSubmitAnswerCommand;
    sessionCtx: ActiveSessionContext; // Trae session y kahoot
    slideId: SlideId;
    slideSnapshot: SlideSnapshot; // Ya validado que existe
}


// * HostStartGame
export interface StartGameContextWithoutResponse {
    command: HostStartGameCommand;
    sessionCtx: ActiveSessionContext;
}

export interface StartGameContextWithResponse {
    command: HostStartGameCommand;
    sessionCtx: ActiveSessionContext;
    response: QuestionStartedResponse; 
}



// * HostNextPhase
export interface NextPhaseContext {
    command: HostNextPhaseCommand;
    sessionCtx: ActiveSessionContext;
    transitionType?: StateTransitionsTypes; // El resultado de session.advanceToNextPhase()
    response?: HostNextPhaseResponse; // La respuesta final construida
}


// * SyncState
export interface SyncStateContext {
    command: SyncStateCommand;
    sessionCtx: ActiveSessionContext; // Garantizamos que tenemos la sesión
    response?: SyncStateResponse;     // Lo llenaremos en la fase de estrategia
}

// * DeleteSession
export interface DeleteSessionContext {
    command: DeleteSessionCommand;
    wasDeleted: boolean; // Para saber qué responder al final
}