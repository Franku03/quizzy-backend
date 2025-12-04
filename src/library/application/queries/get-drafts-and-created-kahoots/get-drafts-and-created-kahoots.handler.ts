import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDraftsAndCreatedKahootsQuery } from './get-drafts-and-created-kahoots.query';
import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import type { ILibraryDao } from '../ports/library.dao.port';
import { LibraryReadModel } from '../read-model/library.read.model';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

@QueryHandler(GetDraftsAndCreatedKahootsQuery)
export class getDraftsAndCreatedKahootsHandler
  implements IQueryHandler<GetDraftsAndCreatedKahootsQuery>
{
  constructor(
    @Inject(DaoName.Library) private readonly libraryDao: ILibraryDao,
  ) {}

  async execute(
    query: GetDraftsAndCreatedKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    return await this.libraryDao.getDraftsAndCreatedKahootsFrom(query);
  }
}
