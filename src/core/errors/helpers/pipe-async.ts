import { Either } from "src/core/types";

export const pipeAsync = async <L, R>(
  initialValue: Either<L, unknown> | Promise<Either<L, unknown>>,
  ...steps: Array<(value: Either<L, any>) => unknown | Promise<unknown>>
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