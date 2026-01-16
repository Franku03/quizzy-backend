import { ICommand } from 'src/core/application/cqrs';

export class RemoveAdminCommand implements ICommand {
  constructor(
    public readonly adminId: string,
    public readonly userToRemoveAdminId: string,
  ) {}
}
