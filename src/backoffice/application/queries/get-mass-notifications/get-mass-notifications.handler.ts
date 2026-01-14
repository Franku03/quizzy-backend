//CQRS
import { QueryHandler } from 'src/core/infrastructure/cqrs';
import { GetMassNotificationsQuery } from './get-mass-notificactions.query';
import { IQueryHandler } from 'src/core/application/cqrs';
import { BackofficeNotificationPaginationReadModel } from '../../read-model/backoffice-notifications.read.model';

//NEST
import { Inject } from '@nestjs/common';

//Database
import type { IBackofficeDao } from '../ports/backoffice.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

//Services
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';

// Aspecto logger
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

//Manejo de Errores
import { Either } from 'src/core/types';

@QueryHandler(GetMassNotificationsQuery)
export class GetMassNotificationsHandler implements IQueryHandler<GetMassNotificationsQuery> {
  constructor(
    @Inject(DaoName.Backoffice) private readonly backofficeDao: IBackofficeDao,
    private readonly mediaService: MediaEnrichmentService,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(
    query: GetMassNotificationsQuery,
  ): Promise<Either<Error, BackofficeNotificationPaginationReadModel>> {
    return await this.backofficeDao.getMassNotifications(query);
  }
}
