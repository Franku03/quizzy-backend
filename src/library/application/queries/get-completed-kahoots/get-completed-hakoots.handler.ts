import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import type { ILibraryDao } from '../ports/library.dao.port';
import { LibraryReadModel } from '../read-model/library.read.model';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { GetCompletedKahootsQuery } from './get-completed-kahoots.query';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';

export class GetCompletedKahootsHandler
  implements IQueryHandler<GetCompletedKahootsQuery>
{
  constructor(
    @Inject(DaoName.Library) private readonly libraryDao: ILibraryDao,
  ) {}

  async execute(
    query: GetCompletedKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    return await this.libraryDao.getCompletedKahoots(query);
  }
}
