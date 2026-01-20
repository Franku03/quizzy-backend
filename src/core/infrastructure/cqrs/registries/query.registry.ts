/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\infrastructure\cqrs\registries\query.registry.ts

export type QueryConstructor = new (...args: any[]) => any;
export type QueryHandlerConstructor = new (...args: any[]) => any;

export class QueryRegistry {
  private static readonly registrations: {
    query: QueryConstructor;
    handler: QueryHandlerConstructor;
  }[] = [];

  static register(
    query: QueryConstructor,
    handler: QueryHandlerConstructor,
  ): void {
    this.registrations.push({ query, handler });
  }

  static getRegistrations(): {
    query: QueryConstructor;
    handler: QueryHandlerConstructor;
  }[] {
    return [...this.registrations];
  }

  static clear(): void {
    this.registrations.length = 0;
  }
}
