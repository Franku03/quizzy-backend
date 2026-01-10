import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import type { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";

import { AssignKahootToGroupCommand } from "./assign-kahoot.command";
import { AssignKahootToGroupResponse } from "../response-dtos/assign-kahoot.response.dto";
import { Inject } from "@nestjs/common";
import { GROUP_ERRORS } from "../group.errors";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { Either, ErrorData, ErrorLayer } from "src/core/types";

import { ICommandHandler } from "src/core/application/cqrs/command-handler.interface";
import { CommandHandler } from "src/core/infrastructure/cqrs/decorators/command-handler.decorator";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { GroupAdminAuthorizer } from 'src/core/application/aspects/auth/strategies/groupAdmin.strategy';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import type { IGroupsDao } from 'src/groups/application/queries/ports/groups.dao.port';


@CommandHandler(AssignKahootToGroupCommand)
export class AssignKahootToGroupHandler implements ICommandHandler<AssignKahootToGroupCommand> {
    private readonly useCase: string = 'Admin assigns a kahoot to a group';
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
        @Inject(DaoName.Group) private readonly groupsQueryDao: IGroupsDao,
    ) { }

    @Log()
    @Authorize(GroupAdminAuthorizer, 'groupsQueryDao')
    async execute(command: AssignKahootToGroupCommand): Promise<Either<ErrorData, AssignKahootToGroupResponse>> {
        const errorContext = createDomainContext('Group', 'assignKahoot', {
            domainObjectId: command.groupId,
            actorId: command.userId,
            userId: command.userId,
            kahootId: command.kahootId,
        });

        const groupOptional = await this.groupRepository.findById(command.groupId);

        if (!groupOptional.hasValue()) {
            return Either.makeLeft(
                DomainErrorFactory.notFound(errorContext, GROUP_ERRORS.NOT_FOUND)
            );
        }

        const group = groupOptional.getValue();

        const kahootOptional = await this.kahootRepository.findKahootById(new KahootId(command.kahootId));

        if (!kahootOptional.hasValue()) {
            return Either.makeLeft(
                DomainErrorFactory.notFound(
                    { ...errorContext, domainObjectType: 'Kahoot', domainObjectId: command.kahootId },
                    GROUP_ERRORS.NOT_FOUND_KAHOOT
                )
            );
        }

        const kahoot = kahootOptional.getValue();

        if (kahoot.isDraft()) {
            return Either.makeLeft(
                DomainErrorFactory.validation(
                    errorContext,
                    { kahootId: [GROUP_ERRORS.KAHOOT_IS_DRAFT] },
                    GROUP_ERRORS.KAHOOT_IS_DRAFT
                )
            );
        }

        if (command.availableFrom > command.availableUntil) {
            return Either.makeLeft(
                DomainErrorFactory.validation(
                    errorContext,
                    { dateRange: [GROUP_ERRORS.INVALID_DATE_RANGE] },
                    GROUP_ERRORS.INVALID_DATE_RANGE
                )
            );
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
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during kahoot assignment: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );

            return Either.makeLeft(unexpectedError);
        }
    }

}