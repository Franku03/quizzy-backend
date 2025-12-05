import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GenerateInvitationCommand } from './generate-invitation.command';
import type { IGroupRepository } from 'src/groups/domain/ports/IGroupRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { ITokenGenerator } from 'src/groups/domain/domain-services/i.token-generator.service.interface';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { Either } from 'src/core/types/either';
import { GROUP_ERRORS } from '../group.errors';
import { InvitationResponse } from '../response-dtos/generate-invitation.response.dto';


@CommandHandler(GenerateInvitationCommand)
export class GenerateInvitationHandler implements ICommandHandler<GenerateInvitationCommand> {
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject('ITokenGenerator')
        private readonly tokenGenerator: ITokenGenerator,
    ) { }

    async execute(command: GenerateInvitationCommand): Promise<Either<Error, InvitationResponse>> {
        const groupOptional = await this.groupRepository.findById(command.groupId);
        if (!groupOptional.hasValue()) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_FOUND));
        }

        const group = groupOptional.getValue();
        const requesterId = new UserId(command.adminId);

        if (!group.isAdmin(requesterId)) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_ADMIN));
        }

        try {
            const tokenVO = group.generateInvitation(
                requesterId,
                this.tokenGenerator,
                command.expiresInDays
            );


            await this.groupRepository.save(group);


            const baseUrl = 'https://quizzy.app/groups/join';
            const link = `${baseUrl}?token=${tokenVO.getValue()}`;

            return Either.makeRight({
                groupId: group.id.value,
                invitationLink: link,
                expiresAt: tokenVO.getExpiresAt()
            });

        } catch (error) {
            return Either.makeLeft(error);
        }
    }
}