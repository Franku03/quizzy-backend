/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\domain\value-objects\group.assignment.completion.ts

import { ValueObject } from "src/core/domain/abstractions/value.object";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";


import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { AttemptId } from "src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id";

interface GroupAssignmentCompletionProps {
    readonly userId: UserId;
    readonly quizId: KahootId;
    readonly attemptId: AttemptId;
    readonly score: Score;
}

export class GroupAssignmentCompletion extends ValueObject<GroupAssignmentCompletionProps> {

    protected constructor(props: GroupAssignmentCompletionProps) {
        if (!props.userId) {
            throw new Error("El userId es requerido.");
        }
        if (!props.quizId) {
            throw new Error("El quizId es requerido.");
        }
        if (!props.attemptId) {
            throw new Error("El attemptId es requerido.");
        }
        if (!props.score) {
            throw new Error("El score es requerido.");
        }
        super(props);
    }

    public static create(
        userId: UserId,
        quizId: KahootId,
        attemptId: AttemptId,
        score: Score
    ): GroupAssignmentCompletion {
        return new GroupAssignmentCompletion({ userId, quizId, attemptId, score });
    }

    public getUserId(): UserId { return this.properties.userId; }
    public getQuizId(): KahootId { return this.properties.quizId; }
    public getAttemptId(): AttemptId { return this.properties.attemptId; }
    public getScore(): Score { return this.properties.score; }


    public toPrimitives() {
        return {
            userId: this.properties.userId.value,
            quizId: this.properties.quizId.value,
            attemptId: this.properties.attemptId.value,
            score: this.properties.score.getScore()
        };
    }
}