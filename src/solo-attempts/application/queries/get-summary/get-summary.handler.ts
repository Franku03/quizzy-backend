// src/solo-attempts/application/queries/get-attempt-summary/get-attempt-summary.handler.ts

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAttemptSummaryQuery } from './get-summary.query';
import type { ISoloAttemptQueryDao } from '../ports/attempts.dao.port';
import { Optional } from 'src/core/types/optional';
import { AttemptSummaryReadModel } from '../read-models/summary.attempt.read.model';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { GET_SUMMARY_ERROR_CODES } from './get-summary.errors';

@QueryHandler(GetAttemptSummaryQuery)
export class GetAttemptSummaryHandler
  implements IQueryHandler<GetAttemptSummaryQuery>
{
  constructor(
    @Inject(DaoName.SoloAttempt)
    private readonly attemptQueryDao: ISoloAttemptQueryDao,
  ) {}

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
      throw new Error(GET_SUMMARY_ERROR_CODES.COMPLETED_ATTEMPT_NOT_FOUND);
    }

    return summaryOptional.getValue();
  }
}