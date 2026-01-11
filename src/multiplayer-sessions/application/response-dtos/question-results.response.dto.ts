/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\question-results.response.dto.ts

import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { PlayerScoreboardEntry } from "./types/player-scoreboard-entry.interface";
import { HostNextPhaseType } from "./enums/host-next-phase-type.enum";

interface CurrentProgress {
    current: number;
    total: number;
}

interface HostCurrentProgress extends CurrentProgress {
    isLastSlide: boolean,
}

export interface QuestionResultsHostResponse {

    state: SessionStateType, 
    correctAnswerId: string[], 
    leaderboard: PlayerScoreboardEntry[], 
    stats: {
        totalAnswers: number,
        distribution: Record<string, number> // Para el gráfico de barras: { "0": 12, "1": 5, "2": 0, "3": 1 }
    },
    progress: HostCurrentProgress 
}

export interface QuestionResultsPlayerResponse {
    state: SessionStateType,
    isCorrect: boolean,
    pointsEarned: number,
    totalScore: number,
    rank: number, // "Estás en el puesto 12"
    previousRank: number, // Estabas antes en el puest 24!
    streak: number,
    correctAnswerIds: string[], // Para que vea cuál era la buena
    message: string // Mensaje motivacional calculado en back
    progress: CurrentProgress
}

export interface QuestionResultsResponse {
    type: HostNextPhaseType.QUESTION_RESULTS,
    hostData: QuestionResultsHostResponse,
    playerData: Map<string, QuestionResultsPlayerResponse>,
}