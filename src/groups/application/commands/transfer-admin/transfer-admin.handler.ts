import { CommandHandler } from "src/core/infrastructure/cqrs/decorators/command-handler.decorator";
import { TransferAdminCommand } from "./transfer-admin.command";
import { ICommandHandler } from "src/core/application/cqrs/command-handler.interface";
import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import type { TransferAdminResponse } from "../response-dtos/transfer-admin.response.dto";

import { GROUP_ERRORS } from "../group.errors";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import type { IUserRepository } from "src/users/domain/ports/IUserRepository";
import { GroupMemberRole } from "src/groups/domain/value-objects/group.member.role";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";



@CommandHandler(TransferAdminCommand)
export class TransferAdminHandler implements ICommandHandler<TransferAdminCommand> {
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject(RepositoryName.User)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(command: TransferAdminCommand): Promise<Either<ErrorData, TransferAdminResponse>> {
        const errorContext = createDomainContext('Group', 'transferAdmin', {
            domainObjectId: command.groupId,
            actorId: command.userId,
            userId: command.userId,
            newAdminId: command.newAdminId,
        });

        try {
            const groupOptional = await this.groupRepository.findById(command.groupId);

            if (!groupOptional.hasValue()) {
                return Either.makeLeft(
                    DomainErrorFactory.notFound(errorContext, GROUP_ERRORS.NOT_FOUND)
                );
            }

            const group = groupOptional.getValue();

            if (!group.isAdmin(new UserId(command.userId))) {
                return Either.makeLeft(
                    DomainErrorFactory.unauthorized(errorContext, GROUP_ERRORS.NOT_ADMIN)
                );
            }

            if (!group.isMember(new UserId(command.newAdminId))) {
                return Either.makeLeft(
                    DomainErrorFactory.notFound(errorContext, GROUP_ERRORS.NOT_MEMBER)
                );
            }

            if (group.isAdmin(new UserId(command.newAdminId))) {
                return Either.makeLeft(
                    DomainErrorFactory.validation(errorContext, { newAdminId: [GROUP_ERRORS.ALREADY_ADMIN] }, GROUP_ERRORS.ALREADY_ADMIN)
                );
            }


            const currentAdminOptional = await this.userRepository.findUserById(new UserId(command.userId));


            if (!currentAdminOptional) {
                return Either.makeLeft(
                    DomainErrorFactory.notFound(errorContext, GROUP_ERRORS.USER_NOT_FOUND)
                );
            }

            const newAdminOptional = await this.userRepository.findUserById(new UserId(command.newAdminId));

            if (!newAdminOptional) {
                return Either.makeLeft(
                    DomainErrorFactory.notFound(errorContext, GROUP_ERRORS.USER_NOT_FOUND)
                );
            }

            group.transferAdmin(new UserId(command.userId), new UserId(command.newAdminId));


            await this.groupRepository.save(group);


            return Either.makeRight({
                groupId: group.getId().value,
                previousAdmin: {
                    userId: currentAdminOptional.id.value,
                    role: GroupMemberRole.MEMBER,
                },
                newAdmin: {
                    userId: newAdminOptional.id.value,
                    role: GroupMemberRole.ADMIN,
                },
                transferredAt: new Date(),
            });

        } catch (error) {
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            if (error instanceof Error && error.message.includes('validation')) {
                return Either.makeLeft(
                    DomainErrorFactory.validation(
                        errorContext,
                        { general: [error.message] },
                        `Validation error: ${error.message}`
                    )
                );
            }
            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during Kahoot creation: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );

            return Either.makeLeft(unexpectedError);
        }
    }
}


