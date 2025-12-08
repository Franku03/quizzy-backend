import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import type { ILibraryDao } from '../ports/library.dao.port';
import { LibraryReadModel } from '../read-model/library.read.model';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { GetInProgressKahootsQuery } from './get-in-progress-kahoots.query';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';

@QueryHandler(GetInProgressKahootsQuery)
export class GetInProgressKahootsHandler
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
