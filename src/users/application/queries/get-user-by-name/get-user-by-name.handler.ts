import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';

import { Inject } from '@nestjs/common';
import { GetUserByNameQuery } from './get-user-by-name.query';
import { UserReadModel } from '../read-model/user.read.model';
import type { IUserDao } from '../ports/users.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

import { Either } from 'src/core/types/either';
import { ErrorData, ErrorLayer } from 'src/core/types';

@QueryHandler(GetUserByNameQuery)
export class GetUserByNameHandler implements IQueryHandler<GetUserByNameQuery> {

  constructor(@Inject(DaoName.User) private readonly userQueryDao: IUserDao) {}

  async execute(query: GetUserByNameQuery): Promise<Either<ErrorData, UserReadModel>> {
    
    const result = await this.userQueryDao.getUserByName(query.userName);

    if (!result.hasValue()) {
        return Either.makeLeft(
            new ErrorData(
                'RESOURCE_NOT_FOUND',
                `User with name '${query.userName}' not found`, 
                ErrorLayer.DOMAIN
            )
        );
    }

    return Either.makeRight(result.getValue());
  }
}