/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\decorators\db-mongo-document.decorator.ts

import {
  DbModelMongoRegistry,
  DocumentConstructor,
} from '../registries/db-model-mongo.registry';

export function DbMongoDocument(key: string) {
  return function (target: DocumentConstructor) {
    DbModelMongoRegistry.registerModel(key, target);
    return target;
  };
}
