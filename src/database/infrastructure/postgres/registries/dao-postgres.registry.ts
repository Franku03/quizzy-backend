/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\registries\dao-postgres.registry.ts

import { DaoConstructor } from '../../class-constructors/dao.constructor';

export class DaoPostgresRegistry {
  private static readonly registrations: Map<string, DaoConstructor> =
    new Map();

  static register(key: string, daoClass: DaoConstructor) {
    this.registrations.set(key, daoClass);
  }

  static get(key: string): DaoConstructor | undefined {
    return this.registrations.get(key);
  }
}
