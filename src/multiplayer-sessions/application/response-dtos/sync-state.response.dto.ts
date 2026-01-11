/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\sync-state.response.dto.ts

import { SyncType } from "./enums/sync-type.enum";
import { SyncData } from "./types/sync-data.type";


export interface QuestionAdditionalData {
    timeRemainingMs: number;
    hasAnswered?: boolean;
}

export interface LobbydditionalData {
    isJoined: boolean
}

export interface SyncStateResponse { 

    type: SyncType

    data?: SyncData;

    // Para cualquier data extra que queramos adjuntar a la respuesta, como contexto adicional por ejemplo
    additionalData?: QuestionAdditionalData | LobbydditionalData

}