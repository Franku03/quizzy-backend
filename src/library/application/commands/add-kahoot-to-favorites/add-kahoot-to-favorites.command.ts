import { ICommand } from 'src/core/application/cqrs/command.interface';

export class AddKahootToFavoritesCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly kahootId: string,
  ) {}
}
