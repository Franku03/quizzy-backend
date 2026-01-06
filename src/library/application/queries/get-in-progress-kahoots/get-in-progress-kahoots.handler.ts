import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import type { ILibraryDao } from '../ports/library.dao.port';
import { LibraryReadModel } from '../read-model/library.read.model';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { GetInProgressKahootsQuery } from './get-in-progress-kahoots.query';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { ErrorData } from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import { LOGGER_TOKEN } from 'src/core/application/aspects/logging/logger.token';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@QueryHandler(GetInProgressKahootsQuery)
export class GetInProgressKahootsHandler
  implements IQueryHandler<GetInProgressKahootsQuery>
{
  constructor(
    @Inject(DaoName.Library) private readonly libraryDao: ILibraryDao,
    private readonly mediaService: MediaEnrichmentService,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(
    query: GetInProgressKahootsQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>> {
    return pipeAsync(
      // Cargar libreria
      this.libraryDao.getInProgressKahoots(query),
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
