export type CommandConstructor = new (...args: any[]) => any;
export type CommandHandlerConstructor = new (...args: any[]) => any;

export class CommandRegistry {
  private static readonly registrations: Array<{
    command: CommandConstructor;
    handler: CommandHandlerConstructor;
  }> = [];

  static register(
    command: CommandConstructor,
    handler: CommandHandlerConstructor,
  ): void {
    this.registrations.push({ command, handler });
  }

  static getRegistrations(): Array<{
    command: CommandConstructor;
    handler: CommandHandlerConstructor;
  }> {
    return [...this.registrations];
  }

  static clear(): void {
    this.registrations.length = 0;
  }
}
