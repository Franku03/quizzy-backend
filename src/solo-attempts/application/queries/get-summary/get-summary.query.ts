// src/solo-attempts/application/queries/get-attempt-summary/get-attempt-summary.query.ts
import { IQuery } from 'src/core/application/cqrs/query.interface';

export class GetAttemptSummaryQuery implements IQuery {
  // We strictly need the attemptId to look up the summary stats
  // It also carries the userId to authorize access to this summary
  constructor(
    public readonly attemptId: string,
    public readonly userId: string
  ) {}
}