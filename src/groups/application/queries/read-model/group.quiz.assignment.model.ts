/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\queries\read-model\group.quiz.assignment.model.ts

export class UserResultModel {
    constructor(
        public readonly score: number,
        public readonly attemptId: string,
        public readonly completedAt: Date,
    ) { }
}

export class GroupQuizAssignmentReadModel {
    constructor(
        public readonly assignmentId: string,
        public readonly quizId: string,
        public readonly title: string,
        public readonly availableUntil: Date,
        public readonly status: 'COMPLETED' | 'PENDING',
        public readonly userResult: UserResultModel | null,
        public readonly leaderboard: Array<{ name: string; score: number }>,
    ) { }
}

