/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\helpers\pipe-async.ts

import { Either } from 'src/core/types';

export const pipeAsync = async <L, R>(
  initialValue: Either<L, unknown> | Promise<Either<L, unknown>>,
  ...steps: ((value: Either<L, any>) => unknown | Promise<unknown>)[]
): Promise<Either<L, R>> => {
  // Resolvemos el valor inicial (puede ser un aggregate o un snapshot inicial)
  let result = await initialValue;

  for (const step of steps) {
    // [EL BREAK]: Si ya tenemos un error, paramos el "tren"
    if (result.isLeft()) break;

    // Ejecutamos el siguiente paso de la tubería
    const next = await step(result);

    // Si el paso nos devuelve un Either, lo adoptamos (posible nuevo error o transformación)
    if (Either.isEither<L, unknown>(next)) {
      result = next;
    } else {
      // Si devuelve un valor plano, lo envolvemos en el carril de Éxito
      result = Either.makeRight<L, unknown>(next);
    }
  }

  // Hacemos el casting final al tipo esperado R (ej: KahootHandlerResponseDto)
  return result as Either<L, R>;
};

/*
export const pipeAsync = async <L, R>(
  initialValue: Either<L, unknown> | Promise<Either<L, unknown>>,
  ...steps: Array<(value: Either<L, unknown>) => any>
): Promise<Either<L, R>> => {
  // Resolvemos el valor inicial
  let result = await initialValue;

  for (const step of steps) {
    // Si ya tenemos un error (Left), paramos el "tren"
    if (result.isLeft()) break;

    // Ejecutamos el siguiente paso de la tubería
    const next = (await step(result)) as unknown;

    // Si el paso nos devuelve un Either, lo adoptamos
    if (Either.isEither<L, unknown>(next)) {
      result = next;
    } else {
      // Si devuelve un valor plano, lo envolvemos en Right
      result = Either.makeRight<L, unknown>(next);
    }
  }

  // Casting final al tipo esperado R
  return result as unknown as Either<L, R>;
};





*/
