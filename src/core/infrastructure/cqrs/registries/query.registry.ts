export type QueryConstructor = new (...args: any[]) => any;
export type QueryHandlerConstructor = new (...args: any[]) => any;

export class QueryRegistry {
  private static readonly registrations: Array<{
    query: QueryConstructor;
    handler: QueryHandlerConstructor;
  }> = [];

  static register(
    query: QueryConstructor,
    handler: QueryHandlerConstructor,
  ): void {
    this.registrations.push({ query, handler });
  }

  static getRegistrations(): Array<{
    query: QueryConstructor;
    handler: QueryHandlerConstructor;
  }> {
    return [...this.registrations];
  }

  static clear(): void {
    this.registrations.length = 0;
  }
}
