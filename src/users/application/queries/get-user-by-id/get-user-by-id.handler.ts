/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\queries\get-user-by-id\get-user-by-id.handler.ts

import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { Inject } from '@nestjs/common';

import { Either } from 'src/core/types/either';

import { GetUserByIdQuery } from './get-user-by-id.query';
import { UserReadModel } from '../read-model/user.read.model';

import type { IUserDao } from '../ports/users.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { ErrorData, ErrorLayer } from 'src/core/types';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  
  constructor(@Inject(DaoName.User) private readonly usersDao: IUserDao) {}

  async execute(query: GetUserByIdQuery): Promise<Either<ErrorData, UserReadModel>> {
    const result = await this.usersDao.getUserById(query.id);

    if (!result.hasValue()) {
      return Either.makeLeft(
         new ErrorData('RESOURCE_NOT_FOUND', `User ${query.id} not found`, ErrorLayer.DOMAIN)
      );
    }

    return Either.makeRight(result.getValue());
  }
}