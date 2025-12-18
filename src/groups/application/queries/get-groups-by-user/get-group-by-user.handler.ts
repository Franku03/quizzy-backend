
import type { IGroupsDao } from '../ports/groups.dao.port';
import { GetGroupsByUserQuery } from './get-group-by-user.query';
import { GroupReadModel } from '../read-model/group.read.model';
import { Inject } from '@nestjs/common';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { Either } from '../../../../core/types/either';
import { GROUP_ERRORS } from '../../commands/group.errors';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';


@QueryHandler(GetGroupsByUserQuery)
export class GetGroupsByUserHandler implements IQueryHandler<GetGroupsByUserQuery> {
    constructor(@Inject(DaoName.Group) private readonly groupsQueryDao: IGroupsDao) { }

    async execute(query: GetGroupsByUserQuery): Promise<Either<Error, GroupReadModel[]>> {
        const groupsOptional = await this.groupsQueryDao.getGroupsByUserId(query.userId);
        if (!groupsOptional.hasValue()) {
            return Either.makeLeft(new Error(GROUP_ERRORS.NOT_FOUND));
        }
        return Either.makeRight(groupsOptional.getValue());
    }
}