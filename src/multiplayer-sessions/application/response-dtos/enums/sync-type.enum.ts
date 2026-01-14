/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\enums\sync-type.enum.ts

export enum SyncType {

    QUESTION_STARTED = 'question_started',
    HOST_RESULTS = 'host_results',
    PLAYER_RESULTS = 'player_results',
    HOST_END_GAME = 'host_end_game',
    PLAYER_END_GAME = 'player_end_game',
    HOST_LOBBY_UPDATE = 'host_lobby_update',
    PLAYER_LOBBY_STATE_UPDATE = 'player_lobby_state_update',

}