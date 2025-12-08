import { IQuery } from './query.interface';

export interface IQueryHandler<TQuery extends IQuery = IQuery> {
  execute(query: TQuery): Promise<any>;
}
