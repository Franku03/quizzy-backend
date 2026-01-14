//CQRS
import { QueryHandler } from 'src/core/infrastructure/cqrs';
import { GetBackofficeUsersQuery } from './get-backoffice-users.query';
import { IQueryHandler } from 'src/core/application/cqrs';
import { BackOfficeUserPaginationReadModel } from '../../read-model/backoffice-user.read.model';

//NEST
import { Inject } from '@nestjs/common';

//Database
import type { IBackofficeDao } from '../ports/backoffice.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

//Services
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';

// Aspecto logger
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

//Manejo de Errores
import { Either } from 'src/core/types';

@QueryHandler(GetBackofficeUsersQuery)
export class GetBackofficeUsersHandler
  implements IQueryHandler<GetBackofficeUsersQuery>
{
  constructor(
    @Inject(DaoName.Backoffice) private readonly backofficeDao: IBackofficeDao,
    private readonly mediaService: MediaEnrichmentService,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(
    query: GetBackofficeUsersQuery,
  ): Promise<Either<Error, BackOfficeUserPaginationReadModel>> {
    return pipeAsync(
      // Cargar libreria
      this.backofficeDao.getBackofficeUsers(query),
      // Enriquecemos los ImageUrlId para convertirlos en Urls
      (res) =>
        res.mapAsync((backofficeUsersModel) =>
          this.mediaService.enrinchBackofficeUserPaginationReadModel(
            backofficeUsersModel as BackOfficeUserPaginationReadModel,
          ),
        ),
    );
  }
}
