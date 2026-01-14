/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\infrastructure\cqrs\registries\command.registry.ts

export type CommandConstructor = new (...args: any[]) => any;
export type CommandHandlerConstructor = new (...args: any[]) => any;

export class CommandRegistry {
  private static readonly registrations: {
    command: CommandConstructor;
    handler: CommandHandlerConstructor;
  }[] = [];

  static register(
    command: CommandConstructor,
    handler: CommandHandlerConstructor,
  ): void {
    this.registrations.push({ command, handler });
  }

  static getRegistrations(): {
    command: CommandConstructor;
    handler: CommandHandlerConstructor;
  }[] {
    return [...this.registrations];
  }

  static clear(): void {
    this.registrations.length = 0;
  }
}
