/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\application\commands\send-mass-notification\send-mass-notification.command.ts

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
