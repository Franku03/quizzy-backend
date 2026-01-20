/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\application\cqrs\command-handler.interface.ts

import { ICommand } from './command.interface';

export interface ICommandHandler<TCommand extends ICommand = ICommand> {
  execute(command: TCommand): Promise<any>;
}
