import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { IGroupsDao } from '../ports/groups.dao.port';
import { GetGroupsByUserQuery } from './get-group-by-user.query';
import { Optional } from '../../../../core/types/optional';
import { GroupReadModel } from '../read-model/group.read.model';
import { Inject } from '@nestjs/common';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';


@QueryHandler(GetGroupsByUserQuery)
export class GetGroupsByUserHandler implements IQueryHandler<GetGroupsByUserQuery> {
    constructor(@Inject(DaoName.Group) private readonly groupsQueryDao: IGroupsDao) { }

    async execute(query: GetGroupsByUserQuery): Promise<Optional<GroupReadModel[]>> {
        return await this.groupsQueryDao.getGroupsByUserId(query.userId);
    }
}