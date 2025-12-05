// src/shared/services/either-handler.service.ts
import { Injectable } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import { Optional } from 'src/core/types/optional';
import { ErrorMapperService, AppError } from './error-mapper.service';

@Injectable()
export class EitherHandlerService {
  constructor(private readonly errorMapper: ErrorMapperService) {}

  handleEither<T, E extends AppError>(either: Either<E, T>): T {
    if (either.isLeft()) {
      throw this.errorMapper.mapToHttpException(either.getLeft());
    }
    return either.getRight();
  }

  handleOptional<T>(
    optional: Optional<T>, 
    notFoundError?: AppError
  ): T {
    if (!optional.hasValue() && notFoundError) {
      throw this.errorMapper.mapToHttpException(notFoundError);
    }
    return optional.getValue();
  }

  handleResult<T, E extends AppError>(
    result: unknown, 
    notFoundError?: AppError
  ): T {
    // 1. Verifica si es un Either
    if (Either.isEither(result)) {
      return this.handleEither(result as Either<E, T>);
    }
    
    // 2. Verifica si es un Optional
    if (Optional.isOptional(result)) {
      return this.handleOptional(result as Optional<T>, notFoundError);
    }
    
    // 3. Si no es ninguno, asume que es un valor directo
    return result as T;
  }

  handleEitherOptional<T, E extends AppError>(
    result: Either<E, Optional<T>>,
    resourceId: string,
    resourceType: string = 'Recurso'
  ): T {
    if (result.isLeft()) {
      throw this.errorMapper.mapToHttpException(result.getLeft());
    }
    
    const optional = result.getRight();
    if (!optional.hasValue()) {
      const notFoundError: AppError = {
        type: `${resourceType}NotFound` as any,
        message: `${resourceType} con ID ${resourceId} no encontrado`,
        timestamp: new Date(),
      };
      throw this.errorMapper.mapToHttpException(notFoundError);
    }
    
    return optional.getValue();
  }
}