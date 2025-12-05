import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { JoinGroupCommand } from "./join-group.command";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import type { IUserRepository } from "src/users/domain/ports/IUserRepository";
import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { Either } from "src/core/types/either";
import { GROUP_ERRORS } from "../group.errors";
import { JoinGroupResponse } from "../response-dtos/join-group.response.dto";
import { InvitationToken } from "src/groups/domain/value-objects/group.invitation.token";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { GroupMemberRole } from "src/groups/domain/value-objects/group.member.role";

@CommandHandler(JoinGroupCommand)
export class JoinGroupHandler implements ICommandHandler<JoinGroupCommand> {
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject(RepositoryName.User)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(command: JoinGroupCommand): Promise<Either<Error, JoinGroupResponse>> {

        const groupOptional = await this.groupRepository.findByInvitationToken(command.invitationToken);



        if (!groupOptional.hasValue()) {
            return Either.makeLeft(new Error(GROUP_ERRORS.INVALID_INVITATION_TOKEN));
        }

        const group = groupOptional.getValue();

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
                return Either.makeLeft(new Error(GROUP_ERRORS.ALREADY_MEMBER));
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
            return Either.makeLeft(error);
        }
    }
}