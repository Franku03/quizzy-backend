import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import type { ILibraryDao } from '../ports/library.dao.port';
import { LibraryReadModel } from '../read-model/library.read.model';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { GetInProgressKahootsQuery } from './get-in-progress-kahoots.query';

@QueryHandler(GetInProgressKahootsQuery)
export class getInProgressKahootsHandler
  implements IQueryHandler<GetInProgressKahootsQuery>
{
  constructor(
    @Inject(DaoName.Library) private readonly libraryDao: ILibraryDao,
  ) {}

  async execute(
    query: GetInProgressKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    return await this.libraryDao.getInProgressKahoots(query);
  }
}
