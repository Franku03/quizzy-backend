import { ICommand } from 'src/core/application/cqrs';

export class UnblockUserCommand implements ICommand {
  constructor(
    public readonly adminId: string,
    public readonly userToUnblockId: string,
  ) {}
}
