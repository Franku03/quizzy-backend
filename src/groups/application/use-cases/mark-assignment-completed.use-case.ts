import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { AttemptId } from "src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { IGroupRepository } from "src/database/domain/repositories/groups/IGroupRepository";
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
        }
    }
}
