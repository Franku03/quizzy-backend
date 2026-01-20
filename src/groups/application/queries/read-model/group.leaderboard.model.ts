/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\queries\read-model\group.leaderboard.model.ts

export class GroupLeaderboardReadModel {
    constructor(
        public readonly userId: string,
        public readonly name: string,
        public readonly completedQuizzes: number,
        public readonly totalPoints: number,
        public readonly position: number,
    ) { }
}