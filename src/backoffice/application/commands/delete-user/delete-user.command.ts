// delete-user.command.ts
import { ICommand } from 'src/core/application/cqrs';

export class DeleteUserCommand implements ICommand {
  constructor(
    public readonly adminId: string,
    public readonly userToDeleteId: string,
  ) {}
}