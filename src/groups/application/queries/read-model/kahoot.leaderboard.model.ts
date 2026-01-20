/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\queries\read-model\kahoot.leaderboard.model.ts

export class KahootLeaderboardReadModel {
    constructor(
        public readonly quizId: string,
        public readonly groupId: string,
        public readonly topPlayers: Object[],
    ) { }
}