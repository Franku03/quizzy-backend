// src/solo-attempts/application/queries/get-resume-context/get-resume-context.handler.ts

import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { GetAttemptStatusQuery } from './get-attempt.query';
import { AttemptResumeReadModel } from '../read-models/resume.attempt.read.model';
import type { ISoloAttemptQueryDao } from '../ports/attempts.dao.port';
import { ATTEMPT_ERROR_CODES } from 'src/solo-attempts/domain/errors/attempt.errors.codes';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { AttemptOwnershipAuthorizer } from 'src/core/application/aspects/auth/strategies/attemptOwnership.strategy';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@QueryHandler(GetAttemptStatusQuery)
export class GetAttemptStatusHandler
  implements IQueryHandler<GetAttemptStatusQuery> {
  private readonly useCase: string = 'User retrieves the status of a solo attempt';

  constructor(
    @Inject(DaoName.SoloAttempt)
    private readonly soloAttemptQueryDao: ISoloAttemptQueryDao,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
    private readonly mediaService: MediaEnrichmentService,
  ) { }

  // The Log decorator automatically logs method execution details. Uses default "logger" property.
  @Log()
  // We check that the user requesting the attempt status owns the attempt
  @Authorize(AttemptOwnershipAuthorizer, 'soloAttemptQueryDao')
  async execute(
    query: GetAttemptStatusQuery,
  ): Promise<AttemptResumeReadModel> {
    // First, we retrieve the resume context for the given attempt
    const attemptOptional = await this.soloAttemptQueryDao.getResumeContext(
      query.attemptId,
    );

    // If the attempt doesn't exist in the system, we throw an error
    if (!attemptOptional.hasValue()) {
      throw new Error(ATTEMPT_ERROR_CODES.ATTEMPT_NOT_FOUND);
    }

    // If found, we return the attempt resume context
    const attempt = attemptOptional.getValue();
    // before returning, we enrich media URLs
    const enrichedAttempt = await this.mediaService.enrichAttemptResume(attempt);

    return enrichedAttempt;
  }
}