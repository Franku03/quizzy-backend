import { ICommand } from './command.interface';

export interface QueryBusPort {
  execute<TQuery extends ICommand>(query: TQuery): Promise<any>;
}
