import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { ILibraryDao } from '../ports/library.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { CheckIfCanBeSavedToFavoritesQuery } from './check-if-can-be-saved-to-favorites.query';
import { Optional } from 'src/core/types/optional';

@QueryHandler(CheckIfCanBeSavedToFavoritesQuery)
export class CheckIfCanBeSavedToFavoritesHandler
  implements IQueryHandler<CheckIfCanBeSavedToFavoritesQuery>
{
  constructor(
    @Inject(DaoName.Library) private readonly libraryDao: ILibraryDao,
  ) {}

  async execute(
    query: CheckIfCanBeSavedToFavoritesQuery,
  ): Promise<Optional<Error>> {
    return await this.libraryDao.checkIfCanBeAddedToFavorites(query.kahootId);
  }
}
