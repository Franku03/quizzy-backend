import { Either } from 'src/core/types';

export const pipeAsync = async <L, R>(
  initialValue: Either<L, any> | Promise<Either<L, any>>,
  ...steps: Array<(value: Either<L, any>) => any | Promise<any>>
): Promise<Either<L, R>> => {

  let result: Either<L, any> = await initialValue;

  for (const step of steps) {
    const next = await step(result);

    if (Either.isEither(next)) {
      result = next as Either<L, any>;
    } else {
      result = Either.makeRight(next);
    }
  }

  return result as Either<L, R>;
};