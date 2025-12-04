// src/solo-attempts/application/queries/get-detailed-report/get-detailed-report.handler.ts

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { Optional } from 'src/core/types/optional';
import { GetDetailedReportQuery } from './attempt.report.query';
import { AttemptReportReadModel } from '../read-models/solo.attempt.report.read.model';
import type { ISoloAttemptQueryDao } from 'src/solo-attempts/application/queries/ports/attempts.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { GET_DETAILED_REPORT_ERROR_CODES } from './attempt.report.errors';

@QueryHandler(GetDetailedReportQuery)
export class GetDetailedReportHandler implements IQueryHandler<GetDetailedReportQuery> {
  // We inject the DAO that knows how to retrieve detailed attempt reports from the database
  constructor(@Inject(DaoName.SoloAttempt) private readonly soloAttemptQueryDao: ISoloAttemptQueryDao) {}

  async execute(query: GetDetailedReportQuery): Promise<AttemptReportReadModel> {
    // We delegate the complex data retrieval to the DAO, which handles the database operations
    // and returns the structured report with all question-by-question results
    const optionalReport = await this.soloAttemptQueryDao.getDetailedReport(query.attemptId);

    // If no report is found, we throw an error indicating the attempt was not found or not completed
    if (!optionalReport.hasValue()) {
      throw new Error(GET_DETAILED_REPORT_ERROR_CODES.INVALID_ATTEMPT);
    }
    return optionalReport.getValue();

    // When user module is integrated, we will check if the userId from the attempt
    // matches the currently authenticated user. For now, we skip this step.
  }
}