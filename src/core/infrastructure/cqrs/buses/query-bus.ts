import { Injectable } from '@nestjs/common';
import { QueryBusPort } from 'src/core/application/cqrs/query-bus.port';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { IQuery } from 'src/core/application/cqrs/query.interface';

type QueryConstructor = new (...args: any[]) => IQuery;

@Injectable()
export class QueryBus implements QueryBusPort {
  private handlers = new Map<QueryConstructor, IQueryHandler>();

  register<TQuery extends IQuery>(
    queryType: QueryConstructor,
    handler: IQueryHandler<TQuery>,
  ): void {
    this.handlers.set(queryType, handler);
  }

  registerAll(registry: Map<QueryConstructor, IQueryHandler>): void {
    for (const [queryType, handler] of registry) {
      this.handlers.set(queryType, handler);
    }
  }

  async execute<TQuery extends IQuery>(query: TQuery): Promise<any> {
    const queryType = query.constructor as QueryConstructor;
    const handler = this.handlers.get(queryType);

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryType.name}`);
    }

    return handler.execute(query);
  }
}
