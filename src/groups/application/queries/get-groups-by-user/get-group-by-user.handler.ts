
import type { IGroupsDao } from '../ports/groups.dao.port';
import { GetGroupsByUserQuery } from './get-group-by-user.query';
import { GroupReadModel } from '../read-model/group.read.model';
import { Inject } from '@nestjs/common';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { GROUP_ERRORS } from '../../commands/group.errors';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';


@QueryHandler(GetGroupsByUserQuery)
export class GetGroupsByUserHandler implements IQueryHandler<GetGroupsByUserQuery> {
    constructor(@Inject(DaoName.Group) private readonly groupsQueryDao: IGroupsDao) { }

    async execute(query: GetGroupsByUserQuery): Promise<Either<ErrorData, GroupReadModel[]>> {
        const errorContext = createDomainContext('Group', 'getGroupsByUser', {
            userId: query.userId,
            actorId: query.userId,
        });

        try {
            const groupsOptional = await this.groupsQueryDao.getGroupsByUserId(query.userId);
            if (!groupsOptional.hasValue()) {
                return Either.makeRight([]);
            }
            return Either.makeRight(groupsOptional.getValue());
        } catch (error) {
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during get groups by user: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );

            return Either.makeLeft(unexpectedError);
        }
    }
}