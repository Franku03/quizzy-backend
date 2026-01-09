/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\decorators\dao-postgres.decorator.ts

import { DaoConstructor } from '../../class-constructors/dao.constructor';
import { DaoPostgresRegistry } from '../registries/dao-postgres.registry';

export function DaoPostgres(key: string) {
  return function (target: DaoConstructor) {
    DaoPostgresRegistry.register(key, target);
    return target;
  };
}
