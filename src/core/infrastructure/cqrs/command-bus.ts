import { Injectable } from '@nestjs/common';
import { CommandBusPort } from 'src/core/application/cqrs/command-bus.port';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { ICommand } from 'src/core/application/cqrs/command.interface';

type CommandConstructor = new (...args: any[]) => ICommand;

@Injectable()
export class CommandBus implements CommandBusPort {
  private handlers = new Map<CommandConstructor, ICommandHandler>();

  /**
   * Registra un handler para un comando específico
   */
  register<TCommand extends ICommand>(
    commandType: CommandConstructor,
    handler: ICommandHandler<TCommand>,
  ): void {
    this.handlers.set(commandType, handler);
  }

  /**
   * Registra múltiples handlers usando un registro
   */
  registerAll(registry: Map<CommandConstructor, ICommandHandler>): void {
    for (const [commandType, handler] of registry) {
      this.handlers.set(commandType, handler);
    }
  }

  /**
   * Ejecuta un comando
   */
  async execute<TCommand extends ICommand>(command: TCommand): Promise<any> {
    const commandType = command.constructor as CommandConstructor;
    const handler = this.handlers.get(commandType);

    if (!handler) {
      throw new Error(`No handler registered for command: ${commandType.name}`);
    }

    return handler.execute(command);
  }
}
