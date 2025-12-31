// src/solo-attempts/application/queries/get-attempt-summary/get-attempt-summary.handler.ts
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { GetAttemptSummaryQuery } from './get-summary.query';
import type { ISoloAttemptQueryDao } from '../ports/attempts.dao.port';
import { AttemptSummaryReadModel } from '../read-models/summary.attempt.read.model';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { ATTEMPT_ERROR_CODES } from 'src/solo-attempts/domain/errors/attempt.errors.codes';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { AttemptOwnershipAuthorizer } from 'src/core/application/aspects/auth/strategies/attemptOwnership.strategy';

@QueryHandler(GetAttemptSummaryQuery)
export class GetAttemptSummaryHandler
  implements IQueryHandler<GetAttemptSummaryQuery>
{
  constructor(
    @Inject(DaoName.SoloAttempt)
    private readonly attemptQueryDao: ISoloAttemptQueryDao,
  ) {}

  // We check that the user requesting the attempt summary owns the attempt
  @Authorize(AttemptOwnershipAuthorizer, 'attemptQueryDao')
  async execute(
    query: GetAttemptSummaryQuery,
  ): Promise<AttemptSummaryReadModel> {
    // We fetch the performance summary for a completed attempt with the given ID.
    // If found, the DAO will return the summary with final score, correct answers, etc.
    // iF the attempt is not found or not completed, the DAO will return an empty Optional
    const summaryOptional = await this.attemptQueryDao.getPerformanceSummary(
      query.attemptId,
    );

    // If no summary is found, we throw an error indicating the completed attempt was not found
    if (!summaryOptional.hasValue()) {
      throw new Error(ATTEMPT_ERROR_CODES.COMPLETED_ATTEMPT_NOT_FOUND);
    }

    return summaryOptional.getValue();
  }
}