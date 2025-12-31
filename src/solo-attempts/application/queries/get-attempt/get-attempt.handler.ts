// src/solo-attempts/application/queries/get-resume-context/get-resume-context.handler.ts

import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { GetAttemptStatusQuery } from './get-attempt.query';
import { AttemptResumeReadModel } from '../read-models/resume.attempt.read.model';
import type { ISoloAttemptQueryDao } from '../ports/attempts.dao.port';
import { ATTEMPT_ERROR_CODES } from 'src/solo-attempts/domain/errors/attempt.errors.codes';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { AttemptOwnershipAuthorizer } from 'src/core/application/aspects/auth/strategies/attemptOwnership.strategy';

@QueryHandler(GetAttemptStatusQuery)
export class GetAttemptStatusHandler
  implements IQueryHandler<GetAttemptStatusQuery>
{
  constructor(
    @Inject(DaoName.SoloAttempt)
    private readonly soloAttemptQueryDao: ISoloAttemptQueryDao,
  ) {}

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

    return attempt;
  }
}