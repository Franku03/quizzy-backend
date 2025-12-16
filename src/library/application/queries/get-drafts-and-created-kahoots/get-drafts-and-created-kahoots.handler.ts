import { GetDraftsAndCreatedKahootsQuery } from './get-drafts-and-created-kahoots.query';
import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import type { ILibraryDao } from '../ports/library.dao.port';
import { LibraryReadModel } from '../read-model/library.read.model';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';

@QueryHandler(GetDraftsAndCreatedKahootsQuery)
export class GetDraftsAndCreatedKahootsHandler
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
