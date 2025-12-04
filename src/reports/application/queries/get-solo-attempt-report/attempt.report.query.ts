// src/solo-attempts/application/queries/get-detailed-report/get-detailed-report.query.ts

export class GetDetailedReportQuery {
  // The query requires the attempt ID to fetch the detailed report for a specific solo attempt
  constructor(public readonly attemptId: string) {}
}