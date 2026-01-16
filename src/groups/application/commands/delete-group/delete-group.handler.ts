/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\commands\delete-group\delete-group.handler.ts

import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { DeleteGroupCommand } from "./delete-group.command";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { GROUP_ERRORS } from "../group.errors";
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



@CommandHandler(DeleteGroupCommand)
export class DeleteGroupHandler implements ICommandHandler<DeleteGroupCommand> {
    private readonly useCase: string = 'Admin deletes a group';
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
        @Inject(DaoName.Group) private readonly groupsQueryDao: IGroupsDao,
    ) { }

    @Log()
    @Authorize(GroupAdminAuthorizer, 'groupsQueryDao')
    async execute(command: DeleteGroupCommand): Promise<Either<ErrorData, void>> {
        const errorContext = createDomainContext('Group', 'deleteGroup', {
            domainObjectId: command.groupId,
            actorId: command.userId,
            userId: command.userId,
        });

        const groupOptional = await this.groupRepository.findById(command.groupId);
        if (!groupOptional.hasValue()) {
            return Either.makeLeft(
                DomainErrorFactory.notFound(errorContext, GROUP_ERRORS.NOT_FOUND)
            );
        }
        const group = groupOptional.getValue();

        try {
            group.deleteGroup(new UserId(command.userId));
            await this.groupRepository.delete(command.groupId);
            return Either.makeRight(undefined);
        } catch (error) {
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during group deletion: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );

            return Either.makeLeft(unexpectedError);
        }
    }
}