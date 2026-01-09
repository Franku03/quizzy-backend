/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\infrastructure\cqrs\decorators\command-handler.decorator.ts

import { CommandRegistry } from '../registries/command.registry';

export function CommandHandler<TCommand extends { new (...args: any[]): any }>(
  command: TCommand,
) {
  return function <THandler extends { new (...args: any[]): any }>(
    handlerClass: THandler,
  ) {
    // Solo registra la relación estáticamente
    CommandRegistry.register(command, handlerClass);
    return handlerClass;
  };
}
