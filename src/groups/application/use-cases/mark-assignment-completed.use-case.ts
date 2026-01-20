/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\use-cases\mark-assignment-completed.use-case.ts

import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { AttemptId } from "src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";

export class MarkAssignmentCompletedUseCase {

    constructor(
        private readonly groupRepository: IGroupRepository
    ) { }

    async execute(data: { userId: string, kahootId: string, attemptId: string, score: number }) {

        const userIdVO = new UserId(data.userId);
        const kahootIdVO = new KahootId(data.kahootId);
        const attemptIdVO = new AttemptId(data.attemptId);
        const scoreVO = Score.create(data.score);

        const groups = await this.groupRepository.findByMemberAndKahoot(data.userId, data.kahootId);



        for (const group of groups) {
            group.markAssignmentAsCompleted(userIdVO, kahootIdVO, attemptIdVO, scoreVO);
            await this.groupRepository.save(group);
            console.log("[Groups] Assignment marked as completed successfully");
        }
    }
}
