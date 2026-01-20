/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\decorators\dao-mongo.decorator.ts

import { DaoConstructor } from '../../class-constructors/dao.constructor';
import { DaoMongoRegistry } from '../registries/dao-mongo.registry';

export function DaoMongo(key: string) {
  return function (target: DaoConstructor) {
    DaoMongoRegistry.register(key, target);
    return target;
  };
}
