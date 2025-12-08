import { ICommand } from './command.interface';

export interface ICommandHandler<TCommand extends ICommand = ICommand> {
  execute(command: TCommand): Promise<any>;
}
