import { IQuery } from 'src/core/application/cqrs/query.interface';

export class GetSubscriptionStatusQuery implements IQuery {
  constructor(public readonly userId: string) {}
}