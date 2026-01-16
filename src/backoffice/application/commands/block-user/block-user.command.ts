import { ICommand } from 'src/core/application/cqrs';

export class BlockUserCommand implements ICommand {
  constructor(
    public readonly adminId: string,
    public readonly userToBeBlockedId: string,
  ) {}
}
