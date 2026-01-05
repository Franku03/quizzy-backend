import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import type { ILibraryDao } from '../ports/library.dao.port';
import { LibraryReadModel } from '../read-model/library.read.model';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { GetCompletedKahootsQuery } from './get-completed-kahoots.query';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { LOGGER_TOKEN } from 'src/core/application/aspects/logging/logger.token';
import { Log } from 'src/core/application/aspects/logging/log.decorator';

@QueryHandler(GetCompletedKahootsQuery)
export class GetCompletedKahootsHandler
  implements IQueryHandler<GetCompletedKahootsQuery>
{
  constructor(
    @Inject(DaoName.Library) private readonly libraryDao: ILibraryDao,
    private readonly mediaService: MediaEnrichmentService,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(
    query: GetCompletedKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    return pipeAsync(
      // Cargar libreria
      this.libraryDao.getCompletedKahoots(query),
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
