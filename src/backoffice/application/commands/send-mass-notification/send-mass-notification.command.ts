import { ICommand } from 'src/core/application/cqrs';

export class SendMassNotificationCommand implements ICommand {
  constructor(
    public readonly senderId: string,
    public readonly title: string, // ej. "mantenimiento programado"
    public readonly message: string, // ej. "Estimado usuario, hola"
    public readonly toAdmins: boolean = false,
    public readonly toRegularUsers: boolean = false,
  ) {}
}
