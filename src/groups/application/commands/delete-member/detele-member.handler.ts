import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { DeleteMemberCommand } from "./delete-member.command";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { Either } from "src/core/types/either";
import { GROUP_ERRORS } from "../group.errors";
import { CommandHandler } from "@nestjs/cqrs";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";



@CommandHandler(DeleteMemberCommand)
export class DeleteMemberHandler implements ICommandHandler<DeleteMemberCommand> {
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
    ) { }


    async execute(command: DeleteMemberCommand): Promise<Either<Error, void>> {

        const requesterId = new UserId(command.requesterId);
        const targetUserId = new UserId(command.targetUserId);

        const groupOptional = await this.groupRepository.findById(command.groupId);

        if (!groupOptional.hasValue()) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_FOUND));
        }

        const group = groupOptional.getValue();

        if (!group.isAdmin(requesterId)) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_ADMIN));
        }

        if (!group.isMember(targetUserId)) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_MEMBER));
        }

        if (group.isAdmin(targetUserId)) {
            return Either.makeLeft(new Error(GROUP_ERRORS.CANNOT_DELETE_ADMIN));
        }

        group.removeMember(requesterId, targetUserId);
        await this.groupRepository.save(group);
        return Either.makeRight(undefined);
    }

}