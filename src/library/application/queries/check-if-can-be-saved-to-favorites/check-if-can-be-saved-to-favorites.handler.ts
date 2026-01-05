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
import { LOGGER_TOKEN } from 'src/core/application/aspects/logging/logger.token';

@QueryHandler(CheckIfCanBeSavedToFavoritesQuery)
export class CheckIfCanBeSavedToFavoritesHandler
  implements IQueryHandler<CheckIfCanBeSavedToFavoritesQuery>
{
  constructor(
    @Inject(DaoName.Library) private readonly libraryDao: ILibraryDao,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(
    query: CheckIfCanBeSavedToFavoritesQuery,
  ): Promise<Optional<ErrorData>> {
    return await this.libraryDao.checkIfCanBeAddedToFavorites(query.kahootId);
  }
}
