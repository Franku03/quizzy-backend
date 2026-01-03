
import { ModifyGroupInformationCommand } from "./modify-group-information.command";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { Inject } from "@nestjs/common";
import { GroupDetails } from "src/groups/domain/value-objects/group.details";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { GROUP_ERRORS } from "../group.errors";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { ModifyGroupResponse } from "../response-dtos/modify-group.response.dto";

import { ICommandHandler } from "src/core/application/cqrs/command-handler.interface";
import { CommandHandler } from "src/core/infrastructure/cqrs/decorators/command-handler.decorator";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";

@CommandHandler(ModifyGroupInformationCommand)
export class ModifyGroupInformationHandler implements ICommandHandler<ModifyGroupInformationCommand> {
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
    ) { }

    async execute(command: ModifyGroupInformationCommand): Promise<Either<ErrorData, ModifyGroupResponse>> {
        const errorContext = createDomainContext('Group', 'modifyGroupInformation', {
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

        if (!group.isAdmin(new UserId(command.userId))) {
            return Either.makeLeft(
                DomainErrorFactory.unauthorized(errorContext, GROUP_ERRORS.NOT_ADMIN)
            );
        }

        try {
            const currentName = group.getName();
            const currentDescription = group.getDescription();

            const nameToUpdate = command.name !== undefined ? command.name : currentName;
            const descriptionToUpdate = command.description !== undefined ? command.description : currentDescription;

            const newDetails = GroupDetails.create(nameToUpdate, descriptionToUpdate);

            group.updateDetails(new UserId(command.userId), newDetails);

            await this.groupRepository.save(group);

            return Either.makeRight({
                id: command.groupId,
                name: group.getName(),
                description: group.getDescription(),
                updatedAt: new Date(),
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
                        GROUP_ERRORS.INVALID_DETAILS
                    )
                );
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during group modification: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );

            return Either.makeLeft(unexpectedError);
        }
    }
}