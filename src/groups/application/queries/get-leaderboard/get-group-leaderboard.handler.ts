import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { GetGroupLeaderboardQuery } from './get-group-leaderboard.query';
import { Inject } from '@nestjs/common';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { GroupLeaderboardReadModel } from '../read-model/group.leaderboard.model';
import type { IGroupsDao } from '../ports/groups.dao.port';
import type { IGroupRepository } from 'src/groups/domain/ports/IGroupRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { GROUP_ERRORS } from 'src/groups/application/commands/group.errors';


@QueryHandler(GetGroupLeaderboardQuery)
export class GetGroupLeaderboardHandler implements IQueryHandler<GetGroupLeaderboardQuery> {
    constructor(
        @Inject(DaoName.Group) private readonly groupsQueryDao: IGroupsDao,
        @Inject(RepositoryName.Group) private readonly groupRepository: IGroupRepository,
    ) { }

    async execute(query: GetGroupLeaderboardQuery): Promise<Either<ErrorData, GroupLeaderboardReadModel[]>> {
        const errorContext = createDomainContext('Group', 'getGroupLeaderboard', {
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

            // Obtener el leaderboard
            const leaderboardOptional = await this.groupsQueryDao.getGroupLeaderboard(query.groupId);
            if (!leaderboardOptional.hasValue()) {
                return Either.makeRight([]);
            }
            return Either.makeRight(leaderboardOptional.getValue());
        } catch (error) {
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during get group leaderboard: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );
            return Either.makeLeft(unexpectedError);
        }
    }
}