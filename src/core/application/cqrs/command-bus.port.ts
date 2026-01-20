/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\application\cqrs\command-bus.port.ts

import { ICommand } from './command.interface';

export interface CommandBusPort {
  execute<TCommand extends ICommand>(command: TCommand): Promise<any>;
}
