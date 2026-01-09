/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\registries\db-model-postgres.registry.ts

export type EntityConstructor<T = any> = new (...args: any[]) => T;

export type PostgresModelRegistration = {
  key: string;
  entity?: EntityConstructor;
};

export class DbModelPostgresRegistry {
  private static readonly registrations: Map<
    string,
    PostgresModelRegistration
  > = new Map();

  static registerEntity(key: string, entity: EntityConstructor) {
    const existing = this.registrations.get(key) ?? { key };
    existing.entity = entity;
    this.registrations.set(key, existing);
  }

  static getRegistrations(): PostgresModelRegistration[] {
    return Array.from(this.registrations.values());
  }

  static clear() {
    this.registrations.clear();
  }
}

// Decorador
export function DbPostgresEntity(key: string) {
  return function (target: EntityConstructor) {
    DbModelPostgresRegistry.registerEntity(key, target);
    return target;
  };
}
