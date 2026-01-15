import { ICommand } from 'src/core/application/cqrs/command.interface';

export class UpgradeToPremiumCommand implements ICommand {
  constructor(
    public readonly userId: string,
  ) {}
}