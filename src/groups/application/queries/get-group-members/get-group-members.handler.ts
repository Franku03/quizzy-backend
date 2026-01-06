import { IQueryHandler } from "src/core/application/cqrs/query-handler.interface";
import { QueryHandler } from "src/core/infrastructure/cqrs/decorators/query-handler.decorator";
import { GetGroupMembersQuery } from "./get-group-members.query";
import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { GROUP_ERRORS } from "src/groups/application/commands/group.errors";
import { GroupMemberReadModel } from "../read-model/group.member.read.model";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { LOGGER_TOKEN } from 'src/core/application/aspects/logging/logger.token';

@QueryHandler(GetGroupMembersQuery)
export class GetGroupMembersHandler implements IQueryHandler<GetGroupMembersQuery> {
    private readonly useCase: string = 'User retrieves the list of members in a group';
    constructor(
        @Inject(RepositoryName.Group) private readonly groupRepository: IGroupRepository,
        @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
    ) { }

    @Log()
    async execute(query: GetGroupMembersQuery): Promise<Either<ErrorData, GroupMemberReadModel[]>> {
        const errorContext = createDomainContext('Group', 'getGroupMembers', {
            domainObjectId: query.groupId,
            actorId: query.userId,
            userId: query.userId,
            intendedAction: 'read',
        });

        try {
            // Validar que el grupo existe
            const groupOptional = await this.groupRepository.findById(query.groupId);
            if (!groupOptional.hasValue()) {
                return Either.makeLeft(
                    DomainErrorFactory.notFound(errorContext, GROUP_ERRORS.NOT_FOUND)
                );
            }

            const group = groupOptional.getValue();
            const userId = new UserId(query.userId);

            // Validar que el usuario pertenece al grupo
            if (!group.isMember(userId)) {
                return Either.makeLeft(
                    DomainErrorFactory.unauthorized(errorContext, GROUP_ERRORS.NOT_MEMBER)
                );
            }

            // Obtener los miembros del grupo y mapearlos al read model
            // Accedemos directamente a los miembros usando los métodos públicos
            const members = group.getMembers().map(member =>
                new GroupMemberReadModel(
                    member.getUserId().value,
                    member.getRole().value,
                    member.getJoinedAt()
                )
            );

            return Either.makeRight(members);
        } catch (error) {
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during get group members: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );
            return Either.makeLeft(unexpectedError);
        }
    }
}

