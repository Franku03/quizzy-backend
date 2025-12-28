// src/solo-attempts/application/queries/get-resume-context/get-resume-context.handler.ts

import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { GetAttemptStatusQuery } from './get-attempt.query';
import { AttemptResumeReadModel } from '../read-models/resume.attempt.read.model';
import type { ISoloAttemptQueryDao } from '../ports/attempts.dao.port';
import { GET_ATTEMPT_ERROR_CODES } from './get-attempt.errors';

@QueryHandler(GetAttemptStatusQuery)
export class GetAttemptStatusHandler
  implements IQueryHandler<GetAttemptStatusQuery>
{
  constructor(
    @Inject(DaoName.SoloAttempt)
    private readonly soloAttemptQueryDao: ISoloAttemptQueryDao,
  ) {}

  async execute(
    query: GetAttemptStatusQuery,
  ): Promise<AttemptResumeReadModel> {
    // First, we retrieve the resume context for the given attempt
    const attemptOptional = await this.soloAttemptQueryDao.getResumeContext(
      query.attemptId,
    );

    // If the attempt doesn't exist in the system, we throw an error
    if (!attemptOptional.hasValue()) {
      throw new Error(GET_ATTEMPT_ERROR_CODES.ATTEMPT_NOT_FOUND);
    }

    const attempt = attemptOptional.getValue();

    // When user module is integrated, we will check if the userId from the attempt
    // matches the currently authenticated user. For now, we skip this step.

    return attempt;
  }
}