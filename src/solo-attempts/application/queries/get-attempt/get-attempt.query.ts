import { IQuery } from 'src/core/application/cqrs/query.interface';

export class GetAttemptStatusQuery implements IQuery {
  // This query carries the unique identifier of the attempt we want to retrieve.
  // It also carries the userId to authorize access to its state
  constructor(
    public readonly attemptId: string,
    public readonly userId: string
  ) {}
}