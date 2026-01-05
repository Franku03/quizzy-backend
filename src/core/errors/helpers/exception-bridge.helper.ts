// src/core/errors/helpers/exception-bridge.helper.ts
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