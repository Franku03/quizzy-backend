/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\commands\register-user\register-user.command.ts

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