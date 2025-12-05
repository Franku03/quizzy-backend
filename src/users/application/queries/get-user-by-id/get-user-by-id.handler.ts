import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { UserReadModel } from '../read-model/user.read.model';
import type { IUserDao } from '../ports/users.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { Either } from 'src/core/types/either';
import { GET_USER_BY_ID_ERROR_CODES } from './get-user-by-id.errors';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  
  constructor(
    @Inject(DaoName.User) // Inyectamos el DAO usando el Token del Catálogo
    private readonly usersDao: IUserDao
  ) {}

  async execute(query: GetUserByIdQuery): Promise<Either<Error, UserReadModel>> {
    const result = await this.usersDao.getUserById(query.id);

    if (!result.hasValue()) {
      return Either.makeLeft(new Error(GET_USER_BY_ID_ERROR_CODES.USER_NOT_FOUND));
    }

    return Either.makeRight(result.getValue());
  }
}