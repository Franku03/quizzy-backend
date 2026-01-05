import { GetDraftsAndCreatedKahootsQuery } from './get-drafts-and-created-kahoots.query';
import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import type { ILibraryDao } from '../ports/library.dao.port';
import { LibraryReadModel } from '../read-model/library.read.model';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { pipeAsync } from '../../../../core/errors/helpers/pipe-async';
import { ErrorData } from 'src/core/types';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { LOGGER_TOKEN } from 'src/core/application/aspects/logging/logger.token';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';

@QueryHandler(GetDraftsAndCreatedKahootsQuery)
export class GetDraftsAndCreatedKahootsHandler
  implements IQueryHandler<GetDraftsAndCreatedKahootsQuery>
{
  constructor(
    @Inject(DaoName.Library) private readonly libraryDao: ILibraryDao,
    private readonly mediaService: MediaEnrichmentService,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(
    query: GetDraftsAndCreatedKahootsQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>> {
    return pipeAsync(
      // Cargamos la libreria
      this.libraryDao.getDraftsAndCreatedKahootsFrom(query),
      // Enriquecemos los ImageUrlId para convertirlos en Urls
      (res) =>
        res.mapAsync((libraryModel) =>
          this.mediaService.enrinchLibraryReadModel(
            libraryModel as LibraryReadModel,
          ),
        ),
    );
  }
}
