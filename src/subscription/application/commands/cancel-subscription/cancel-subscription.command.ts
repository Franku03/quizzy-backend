import { ICommand } from 'src/core/application/cqrs/command.interface';

export class CancelSubscriptionCommand implements ICommand {
  constructor(
    public readonly userId: string,
  ) {}
}