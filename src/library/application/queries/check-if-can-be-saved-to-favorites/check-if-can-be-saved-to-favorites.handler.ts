/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\library\application\queries\check-if-can-be-saved-to-favorites\check-if-can-be-saved-to-favorites.handler.ts

import { Inject } from '@nestjs/common';
import type { ILibraryDao } from '../ports/library.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { CheckIfCanBeSavedToFavoritesQuery } from './check-if-can-be-saved-to-favorites.query';
import { Optional } from 'src/core/types/optional';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { ErrorData } from 'src/core/types';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@QueryHandler(CheckIfCanBeSavedToFavoritesQuery)
export class CheckIfCanBeSavedToFavoritesHandler
  implements IQueryHandler<CheckIfCanBeSavedToFavoritesQuery>
{
  constructor(
    @Inject(DaoName.Library) private readonly libraryDao: ILibraryDao,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(
    query: CheckIfCanBeSavedToFavoritesQuery,
  ): Promise<Optional<ErrorData>> {
    return await this.libraryDao.checkIfCanBeAddedToFavorites(query.kahootId);
  }
}
