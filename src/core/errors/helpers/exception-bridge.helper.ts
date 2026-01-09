/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\helpers\exception-bridge.helper.ts

import { Either } from 'src/core/types/either';

/**
 * Transforma el resultado de un Bus (Either) en un valor directo o lanza una excepción.
 * Mantiene el código de los controllers limpio y el tipado estricto.
 */
export const throwResult = <T>(result: unknown): T => {
  if (result === null || result === undefined) return result as T;

  // Usamos el método estático de tu clase Either
  if (Either.isEither(result)) {
    if (result.isLeft()) {
      // Lanzamos ErrorData para que el AllExceptionsFilter lo atrape
      throw result.getLeft();
    }
    return result.getRight() as T;
  }

  return result as T;
};