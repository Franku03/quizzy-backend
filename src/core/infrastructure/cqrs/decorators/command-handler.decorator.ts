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
