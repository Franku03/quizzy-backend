/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\commands\delete-member\detele-member.handler.ts

import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { DeleteMemberCommand } from "./delete-member.command";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { Inject } from "@nestjs/common";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { GROUP_ERRORS } from "../group.errors";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { EVENT_BUS_TOKEN } from "src/core/domain/ports/event-bus.token";
import type { EventBus } from "src/core/domain/ports/event-bus.port";
import { MemberRemovedEvent } from "src/core/domain/domain-events/member-removed.event";


import { ICommandHandler } from "src/core/application/cqrs/command-handler.interface";
import { CommandHandler } from "src/core/infrastructure/cqrs/decorators/command-handler.decorator";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import type { IGroupsDao } from 'src/groups/application/queries/ports/groups.dao.port';

@CommandHandler(DeleteMemberCommand)
export class DeleteMemberHandler implements ICommandHandler<DeleteMemberCommand> {
    private readonly useCase: string = 'User removes a member from a group or leaves the group';
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject(EVENT_BUS_TOKEN)
        private readonly eventBus: EventBus,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
        @Inject(DaoName.Group) private readonly groupsQueryDao: IGroupsDao,
    ) { }

    @Log()
    async execute(command: DeleteMemberCommand): Promise<Either<ErrorData, void>> {
        const errorContext = createDomainContext('Group', 'deleteMember', {
            domainObjectId: command.groupId,
            actorId: command.userId,
            userId: command.userId,
            targetUserId: command.targetUserId,
        });

        const requesterId = new UserId(command.userId);
        const targetUserId = new UserId(command.targetUserId);

        const groupOptional = await this.groupRepository.findById(command.groupId);

        if (!groupOptional.hasValue()) {
            return Either.makeLeft(
                DomainErrorFactory.notFound(errorContext, GROUP_ERRORS.NOT_FOUND)
            );
        }

        const group = groupOptional.getValue();

        if (!group.isMember(targetUserId)) {
            return Either.makeLeft(
                DomainErrorFactory.unauthorized(errorContext, GROUP_ERRORS.NOT_MEMBER)
            );
        }

        const isSelfRemoval = requesterId.equals(targetUserId);

        if (!isSelfRemoval) {
            const isAdmin = await this.groupsQueryDao.isGroupAdmin(command.groupId, command.userId);
            if (!isAdmin) {
                return Either.makeLeft(
                    DomainErrorFactory.unauthorized(errorContext, GROUP_ERRORS.NOT_ADMIN)
                );
            }
        }

        if (group.isAdmin(targetUserId)) {
            return Either.makeLeft(
                DomainErrorFactory.unauthorized(errorContext, GROUP_ERRORS.CANNOT_DELETE_ADMIN)
            );
        }

        try {
            group.removeMember(requesterId, targetUserId);
            await this.groupRepository.save(group);
            const event = new MemberRemovedEvent(targetUserId.value, group.id.value, requesterId.value);
            await this.eventBus.publish([event]);
            console.log(`[EventBus] Evento publicado: ${MemberRemovedEvent.name}`);

            return Either.makeRight(undefined);
        } catch (error) {
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during member deletion: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );

            return Either.makeLeft(unexpectedError);
        }
    }

}