import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { DeleteMemberCommand } from "./delete-member.command";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { Either } from "src/core/types/either";
import { GROUP_ERRORS } from "../group.errors";
import { CommandHandler } from "@nestjs/cqrs";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { EVENT_BUS_TOKEN } from "src/core/domain/ports/event-bus.token";
import type { EventBus } from "src/core/domain/ports/event-bus.port";
import { MemberRemovedEvent } from "src/core/domain/domain-events/member-removed.event";


@CommandHandler(DeleteMemberCommand)
export class DeleteMemberHandler implements ICommandHandler<DeleteMemberCommand> {
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject(EVENT_BUS_TOKEN)
        private readonly eventBus: EventBus,
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

        try {
            group.removeMember(requesterId, targetUserId);
            await this.groupRepository.save(group);
            const event = new MemberRemovedEvent(targetUserId.value, group.id.value, requesterId.value);
            await this.eventBus.publish([event]);
            console.log(`[EventBus] Evento publicado: ${MemberRemovedEvent.name}`);

            return Either.makeRight(undefined);
        } catch (error) {
            return Either.makeLeft(new Error(error.message));
        }
    }

}