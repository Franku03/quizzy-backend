import { ICommand } from './command.interface';

export interface CommandBusPort {
  execute<TCommand extends ICommand>(command: TCommand): Promise<any>;
}
