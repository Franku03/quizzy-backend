/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\registries\repository-mongo.registry.ts

import { RepositoryConstructor } from '../../class-constructors/repository.constructor';

export class RepositoryMongoRegistry {
  private static readonly registrations: Map<string, RepositoryConstructor> =
    new Map();

  static register(key: string, repoClass: RepositoryConstructor) {
    this.registrations.set(key, repoClass);
  }

  static get(key: string): RepositoryConstructor | undefined {
    return this.registrations.get(key);
  }
}
