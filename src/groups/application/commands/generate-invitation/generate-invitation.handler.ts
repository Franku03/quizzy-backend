
import { Inject } from '@nestjs/common';
import { GenerateInvitationCommand } from './generate-invitation.command';
import type { IGroupRepository } from 'src/groups/domain/ports/IGroupRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { ITokenGenerator } from 'src/groups/domain/domain-services/i.token-generator.service.interface';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { GROUP_ERRORS } from '../group.errors';
import { InvitationResponse } from '../response-dtos/generate-invitation.response.dto';

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


@CommandHandler(GenerateInvitationCommand)
export class GenerateInvitationHandler implements ICommandHandler<GenerateInvitationCommand> {
    private readonly useCase: string = 'Admin generates an invitation link for a group';
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject('ITokenGenerator')
        private readonly tokenGenerator: ITokenGenerator,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
        @Inject(DaoName.Group) private readonly groupsQueryDao: IGroupsDao,
    ) { }

    @Log()
    @Authorize(GroupAdminAuthorizer, 'groupsQueryDao')
    async execute(command: GenerateInvitationCommand): Promise<Either<ErrorData, InvitationResponse>> {
        const errorContext = createDomainContext('Group', 'generateInvitation', {
            domainObjectId: command.groupId,
            actorId: command.adminId,
            userId: command.adminId,
        });

        const groupOptional = await this.groupRepository.findById(command.groupId);
        if (!groupOptional.hasValue()) {
            return Either.makeLeft(
                DomainErrorFactory.notFound(errorContext, GROUP_ERRORS.NOT_FOUND)
            );
        }

        const group = groupOptional.getValue();
        const requesterId = new UserId(command.adminId);

        try {
            const tokenVO = group.generateInvitation(
                requesterId,
                this.tokenGenerator,
                command.expiresInDays
            );

            await this.groupRepository.save(group);

            const baseUrl = 'https://quizzy-backend-0wh2.onrender.com/groups/join';
            const link = `${baseUrl}?token=${tokenVO.getValue()}`;

            return Either.makeRight({
                groupId: group.id.value,
                invitationLink: link,
                expiresAt: tokenVO.getExpiresAt()
            });

        } catch (error) {
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during invitation generation: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );

            return Either.makeLeft(unexpectedError);
        }
    }
}