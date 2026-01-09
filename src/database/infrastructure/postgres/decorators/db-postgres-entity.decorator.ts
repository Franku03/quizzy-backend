/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\decorators\db-postgres-entity.decorator.ts

import {
  DbModelPostgresRegistry,
  EntityConstructor,
} from '../registries/db-model-postgres.registry';

export function DbPostgresEntity(key: string) {
  return function (target: EntityConstructor) {
    DbModelPostgresRegistry.registerEntity(key, target);
    return target;
  };
}
