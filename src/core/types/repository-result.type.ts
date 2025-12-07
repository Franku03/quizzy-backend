// src/shared/domain/types/repository-result.type.ts
import { Either } from '../types/either';
import { RepositoryError } from '../../database/infrastructure/errors/repository-error';
import { Optional } from './optional';

// Resultado estándar para operaciones del repositorio
export type RepositoryResult<T> = Either<RepositoryError, T>;

// Resultado para operaciones de búsqueda que pueden no encontrar nada
export type OptionalRepositoryResult<T> = Either<RepositoryError, Optional<T>>;

// Métodos helpers para facilitar el uso
export class RepositoryResultHelpers {
  static success<T>(value: T): RepositoryResult<T> {
    return Either.makeRight<RepositoryError, T>(value);
  }

  static failure<T>(error: RepositoryError): RepositoryResult<T> {
    return Either.makeLeft<RepositoryError, T>(error);
  }

  static optionalSuccess<T>(value: T): OptionalRepositoryResult<T> {
    return Either.makeRight<RepositoryError, Optional<T>>(new Optional(value));
  }

  
  static optionalEmpty<T>(): OptionalRepositoryResult<T> {
    return Either.makeRight<RepositoryError, Optional<T>>(new Optional());
  }

  static optionalFailure<T>(error: RepositoryError): OptionalRepositoryResult<T> {
    return Either.makeLeft<RepositoryError, Optional<T>>(error);
  }
}