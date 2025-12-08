import { ICommand } from 'src/core/application/cqrs/command.interface';

export class RemoveKahootFromFavoritesCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly kahootId: string,
  ) {}
}
