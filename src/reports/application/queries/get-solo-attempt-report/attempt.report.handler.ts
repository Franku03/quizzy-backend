// src/solo-attempts/application/queries/get-detailed-report/get-detailed-report.handler.ts

import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { GetDetailedReportQuery } from './attempt.report.query';
import { AttemptReportReadModel } from '../read-models/solo.attempt.report.read.model';
import type { ISoloAttemptQueryDao } from 'src/solo-attempts/application/queries/ports/attempts.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { ATTEMPT_ERROR_CODES } from 'src/solo-attempts/domain/errors/attempt.errors.codes';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { AttemptOwnershipAuthorizer } from 'src/core/application/aspects/auth/strategies/attemptOwnership.strategy';

@QueryHandler(GetDetailedReportQuery)
export class GetDetailedReportHandler implements IQueryHandler<GetDetailedReportQuery> {
  // We inject the DAO that knows how to retrieve detailed attempt reports from the database
  constructor(@Inject(DaoName.SoloAttempt) private readonly soloAttemptQueryDao: ISoloAttemptQueryDao) {}

  // We check that the user requesting the detailed report owns the attempt
  @Authorize(AttemptOwnershipAuthorizer, 'soloAttemptQueryDao')
  async execute(query: GetDetailedReportQuery): Promise<AttemptReportReadModel> {
    // We delegate the complex data retrieval to the DAO, which handles the database operations
    // and returns the structured report with all question-by-question results
    const optionalReport = await this.soloAttemptQueryDao.getDetailedReport(query.attemptId);

    // If no report is found, we throw an error indicating the attempt was not found or not completed
    if (!optionalReport.hasValue()) {
      throw new Error(ATTEMPT_ERROR_CODES.COMPLETED_ATTEMPT_NOT_FOUND);
    }
    return optionalReport.getValue();

  }
}