// src/solo-attempts/application/queries/get-attempt-summary/get-attempt-summary.query.ts

export class GetAttemptSummaryQuery {
  // We strictly need the attemptId to look up the summary stats
  constructor(public readonly attemptId: string) {}
}