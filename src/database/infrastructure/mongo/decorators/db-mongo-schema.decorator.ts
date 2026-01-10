/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\decorators\db-mongo-schema.decorator.ts

import { Schema } from 'mongoose';
import { DbModelMongoRegistry } from '../registries/db-model-mongo.registry';

export function DbMongoSchema(key: string) {
  return function (target: Schema) {
    DbModelMongoRegistry.registerSchema(key, target);
    return target;
  };
}
