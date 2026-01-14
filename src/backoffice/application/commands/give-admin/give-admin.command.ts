import { ICommand } from 'src/core/application/cqrs';

export class GiveAdminCommand implements ICommand {
  constructor(
    public readonly adminId: string,
    public readonly userToGiveAdminId: string,
  ) {}
}
