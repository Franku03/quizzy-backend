import { UserType } from 'src/users/domain/value-objects/user.type';
import { ICommand } from 'src/core/application/cqrs';

export class RegisterUserCommand implements ICommand {
  public readonly email: string;
  public readonly username: string;
  public readonly password: string;
  public readonly name: string;
  public readonly type: string;

  constructor(props: { email: string; username: string; password: string; name: string; type: string }) {
      Object.assign(this, props);
  }
}