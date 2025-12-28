import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { GetGroupLeaderboardQuery } from './get-group-leaderboard.query';
import { Inject } from '@nestjs/common';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { GroupLeaderboardReadModel } from '../read-model/group.leaderboard.model';
import type { IGroupsDao } from '../ports/groups.dao.port';


@QueryHandler(GetGroupLeaderboardQuery)
export class GetGroupLeaderboardHandler implements IQueryHandler<GetGroupLeaderboardQuery> {
    constructor(@Inject(DaoName.Group) private readonly groupsQueryDao: IGroupsDao) { }

    async execute(query: GetGroupLeaderboardQuery): Promise<Either<ErrorData, GroupLeaderboardReadModel[]>> {
        const errorContext = createDomainContext('Group', 'getGroupLeaderboard', {
            userId: query.userId,
            groupId: query.groupId,
        });

        try {
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