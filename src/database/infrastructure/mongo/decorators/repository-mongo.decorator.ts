/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\decorators\repository-mongo.decorator.ts

import { RepositoryConstructor } from '../../class-constructors/repository.constructor';
import { RepositoryMongoRegistry } from '../registries/repository-mongo.registry';

export function RepositoryMongo(key: string) {
  return function (target: RepositoryConstructor) {
    RepositoryMongoRegistry.register(key, target);
    return target;
  };
}
