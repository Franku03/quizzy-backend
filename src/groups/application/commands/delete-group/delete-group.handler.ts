import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { DeleteGroupCommand } from "./delete-group.command";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { Either } from "src/core/types/either";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { GROUP_ERRORS } from "../group.errors";
import { CommandHandler } from "@nestjs/cqrs";
import { ICommandHandler } from "@nestjs/cqrs";

@CommandHandler(DeleteGroupCommand)
export class DeleteGroupHandler implements ICommandHandler<DeleteGroupCommand> {
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
    ) { }

    async execute(command: DeleteGroupCommand): Promise<Either<Error, void>> {
        const groupOptional = await this.groupRepository.findById(command.groupId);
        if (!groupOptional.hasValue()) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_FOUND));
        }
        const group = groupOptional.getValue();
        if (!group.isAdmin(new UserId(command.userId))) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_ADMIN));
        }
        group.deleteGroup(new UserId(command.userId));
        await this.groupRepository.delete(command.groupId);
        return Either.makeRight(undefined);
    }
}