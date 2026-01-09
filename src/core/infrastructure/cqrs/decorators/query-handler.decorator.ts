/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\infrastructure\cqrs\decorators\query-handler.decorator.ts

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
