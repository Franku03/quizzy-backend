// src/solo-attempts/application/queries/get-detailed-report/get-detailed-report.query.ts
import { IQuery } from 'src/core/application/cqrs/query.interface';

export class GetDetailedReportQuery implements IQuery {
  // The query requires the attempt ID to fetch the detailed report for a specific solo attempt
  constructor(public readonly attemptId: string) {}
}