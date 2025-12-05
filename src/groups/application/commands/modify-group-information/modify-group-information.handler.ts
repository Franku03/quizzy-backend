import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ModifyGroupInformationCommand } from "./modify-group-information.command";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { BadRequestException, Inject, NotFoundException } from "@nestjs/common";
import { GroupDetails } from "src/groups/domain/value-objects/group.details";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { GROUP_ERRORS } from "../group.errors";
import { Either } from "src/core/types/either";
import { ModifyGroupResponse } from "../response-dtos/modify-group.response.dto";

@CommandHandler(ModifyGroupInformationCommand)
export class ModifyGroupInformationHandler implements ICommandHandler<ModifyGroupInformationCommand> {
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
    ) { }

    async execute(command: ModifyGroupInformationCommand): Promise<Either<Error, ModifyGroupResponse>> {

        const groupOptional = await this.groupRepository.findById(command.groupId);

        if (!groupOptional.hasValue()) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_FOUND));
        }

        const group = groupOptional.getValue();

        if (!group.isAdmin(new UserId(command.userId))) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_ADMIN));
        }

        try {

            const currentName = group.getName();
            const currentDescription = group.getDescription();

            const nameToUpdate = command.name !== undefined ? command.name : currentName;
            const descriptionToUpdate = command.description !== undefined ? command.description : currentDescription;

            const newDetails = GroupDetails.create(nameToUpdate, descriptionToUpdate);

            group.updateDetails(new UserId(command.userId), newDetails);

            await this.groupRepository.save(group);

            return Either.makeRight({
                id: command.groupId,
                name: group.getName(),
                description: group.getDescription(),
                updatedAt: new Date(),
            });

        } catch (error) {
            return Either.makeLeft(new Error(GROUP_ERRORS.INVALID_DETAILS));
        }
    }
}