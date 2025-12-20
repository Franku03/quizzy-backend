
import { JoinGroupCommand } from "./join-group.command";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import type { IUserRepository } from "src/users/domain/ports/IUserRepository";
import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { GROUP_ERRORS } from "../group.errors";
import { JoinGroupResponse } from "../response-dtos/join-group.response.dto";
import { InvitationToken } from "src/groups/domain/value-objects/group.invitation.token";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { GroupMemberRole } from "src/groups/domain/value-objects/group.member.role";


import { ICommandHandler } from "src/core/application/cqrs/command-handler.interface";
import { CommandHandler } from "src/core/infrastructure/cqrs/decorators/command-handler.decorator";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";

@CommandHandler(JoinGroupCommand)
export class JoinGroupHandler implements ICommandHandler<JoinGroupCommand> {
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject(RepositoryName.User)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(command: JoinGroupCommand): Promise<Either<ErrorData, JoinGroupResponse>> {
        const errorContext = createDomainContext('Group', 'joinGroup', {
            userId: command.userId,
            actorId: command.userId,
            invitationToken: command.invitationToken,
        });

        const groupOptional = await this.groupRepository.findByInvitationToken(command.invitationToken);

        if (!groupOptional.hasValue()) {
            return Either.makeLeft(
                DomainErrorFactory.validation(
                    errorContext,
                    { invitationToken: [GROUP_ERRORS.INVALID_INVITATION_TOKEN] },
                    GROUP_ERRORS.INVALID_INVITATION_TOKEN
                )
            );
        }

        const group = groupOptional.getValue();
        const groupId = group.getId().value;
        const updatedContext = { ...errorContext, domainObjectId: groupId };

        try {
            const userToJoin = new UserId(command.userId);
            // pending: descomentar cuando se tenga el repositorio de usuarios

            /*
            const user = await this.userRepository.findById(userToJoin);
                        if (!user.hasValue()) {
                            return Either.makeLeft(new Error(GROUP_ERRORS.USER_NOT_FOUND));
                        }
                        const user = userOptional.getValue();
                        
                        
            */
            // pending: aplicar logica real cuando se tenga el repositorio de usuarios
            const isAdminPremium = false;

            const storedToken = group.toPrimitives().invitationToken;
            const tokenVO = InvitationToken.fromPrimitives(
                command.invitationToken,
                storedToken?.expiresAt ?? new Date()
            );

            if (group.isMember(userToJoin)) {
                return Either.makeLeft(
                    DomainErrorFactory.conflict(
                        updatedContext,
                        'DUPLICATE',
                        GROUP_ERRORS.ALREADY_MEMBER
                    )
                );
            }

            group.joinGroup(userToJoin, tokenVO, isAdminPremium);

            await this.groupRepository.save(group);

            return Either.makeRight({
                groupId: group.getId().value,
                groupName: group.getName(),
                joinedAt: new Date(),
                role: GroupMemberRole.MEMBER
            });

        } catch (error) {
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during join group: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                updatedContext,
                error as Error
            );

            return Either.makeLeft(unexpectedError);
        }
    }
}