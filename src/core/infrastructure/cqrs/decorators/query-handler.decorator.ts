import { QueryRegistry } from '../registries/query.registry';

export function QueryHandler<TQuery extends { new (...args: any[]): any }>(
  query: TQuery,
) {
  return function <THandler extends { new (...args: any[]): any }>(
    handlerClass: THandler,
  ) {
    QueryRegistry.register(query, handlerClass);
    return handlerClass;
  };
}
