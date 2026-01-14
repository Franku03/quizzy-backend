/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\types\sync-data.type.ts

import { HostEndGameResponse, PlayerEndGameResponse } from "../game-ended.response.dto";
import { HostLobbyUpdateResponse, LobbyStateUpdateResponse, PlayerLobbyUpdateResponse,  } from "../lobby-state-update.response.dto";
import { QuestionResultsHostResponse, QuestionResultsPlayerResponse } from "../question-results.response.dto";
import { QuestionStartedResponse } from "../question-started.response.dto";


export type SyncData = 
    QuestionStartedResponse 
    | QuestionResultsHostResponse | QuestionResultsPlayerResponse
    | HostEndGameResponse | PlayerEndGameResponse
    | LobbyStateUpdateResponse | HostLobbyUpdateResponse | PlayerLobbyUpdateResponse;