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



@CommandHandler(DeleteGroupCommand)
export class DeleteGroupHandler implements ICommandHandler<DeleteGroupCommand> {
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
    ) { }

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
        if (!group.isAdmin(new UserId(command.userId))) {
            return Either.makeLeft(
                DomainErrorFactory.unauthorized(errorContext, GROUP_ERRORS.NOT_ADMIN)
            );
        }

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