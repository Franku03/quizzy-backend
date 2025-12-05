import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import type { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";

import { AssignKahootToGroupCommand } from "./assign-kahoot.command";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { AssignKahootToGroupResponse } from "../response-dtos/assign-kahoot.response.dto";
import { Inject } from "@nestjs/common";
import { GROUP_ERRORS } from "../group.errors";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { Either } from "src/core/types/either";

@CommandHandler(AssignKahootToGroupCommand)
export class AssignKahootToGroupHandler implements ICommandHandler<AssignKahootToGroupCommand> {
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
    ) { }

    async execute(command: AssignKahootToGroupCommand): Promise<Either<Error, AssignKahootToGroupResponse>> {

        const groupOptional = await this.groupRepository.findById(command.groupId);

        if (!groupOptional.hasValue()) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_FOUND));
        }

        const group = groupOptional.getValue();

        if (!group.isAdmin(new UserId(command.userId))) {
            return Either.makeLeft(new Error(GROUP_ERRORS.ONLY_ADMIN));
        }

        const kahootOptional = await this.kahootRepository.findKahootById(new KahootId(command.kahootId));

        if (!kahootOptional.hasValue()) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_FOUND_KAHOOT));
        }

        const kahoot = kahootOptional.getValue();

        if (kahoot.isDraft()) {
            return Either.makeLeft(new Error(GROUP_ERRORS.KAHOOT_IS_DRAFT));
        }

        if (command.availableFrom > command.availableUntil) {
            return Either.makeLeft(new Error(GROUP_ERRORS.INVALID_DATE_RANGE));
        }

        try {
            group.assignKahoot(new UserId(command.userId), new KahootId(command.kahootId), command.availableFrom, command.availableUntil);

            await this.groupRepository.save(group);

            return Either.makeRight({
                groupId: group.id.value,
                quizId: kahoot.id.value,
                assignedBy: command.userId,
                availableFrom: command.availableFrom,
                availableTo: command.availableUntil,
            });

        } catch (error) {
            return Either.makeLeft(new Error(error.message));
        }
    }

}