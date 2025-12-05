// src/shared/services/command-query-executor.service.ts
import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EitherHandlerService } from './either-handler.service';
import { AppError } from './error-mapper.service';
import { Either } from 'src/core/types/either';
import { Optional } from 'src/core/types/optional';

@Injectable()
export class CommandQueryExecutorService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eitherHandler: EitherHandlerService,
  ) {}

  /**
   * Ejecuta un comando y maneja el resultado Either
   */
  async executeCommand<T, E extends AppError = AppError>(command: any): Promise<T> {
    const result: Either<E, T> = await this.commandBus.execute(command);
    return this.eitherHandler.handleEither<T, E>(result);
  }

  /**
   * Ejecuta una query y maneja el resultado Either
   */
  async executeQuery<T, E extends AppError = AppError>(query: any): Promise<T> {
    const result: Either<E, T> = await this.queryBus.execute(query);
    return this.eitherHandler.handleEither<T, E>(result);
  }

  /**
   * Ejecuta una query que retorna Either<Optional> y maneja NotFound
   */
  async executeQueryOptional<T, E extends AppError = AppError>(
    query: any,
    resourceId: string,
    resourceType: string = 'Recurso'
  ): Promise<T> {
    const result: Either<E, Optional<T>> = await this.queryBus.execute(query);
    return this.eitherHandler.handleEitherOptional<T, E>(
      result,
      resourceId,
      resourceType
    );
  }

  /**
   * Ejecuta una query y retorna el Optional (sin lanzar error si está vacío)
   */
  async executeQueryToOptional<T, E extends AppError = AppError>(
    query: any
  ): Promise<Optional<T>> {
    const result: Either<E, Optional<T>> = await this.queryBus.execute(query);
    
    if (result.isLeft()) {
      throw this.eitherHandler['errorMapper'].mapToHttpException(result.getLeft());
    }
    
    return result.getRight();
  }

  /**
   * Ejecuta un comando y devuelve el Either sin procesar
   * Útil para manejar errores personalizados
   */
  async executeCommandRaw<E extends AppError, T>(command: any): Promise<Either<E, T>> {
    return this.commandBus.execute(command);
  }

  /**
   * Ejecuta una query y devuelve el Either sin procesar
   * Útil para manejar errores personalizados
   */
  async executeQueryRaw<E extends AppError, T>(query: any): Promise<Either<E, T>> {
    return this.queryBus.execute(query);
  }

  /**
   * Ejecuta comando silenciosamente (retorna null en caso de error)
   */
  async executeCommandSilently<T, E extends AppError = AppError>(
    command: any,
    onError?: (error: E) => void
  ): Promise<T | null> {
    try {
      return await this.executeCommand<T, E>(command);
    } catch (error) {
      onError?.(error as E);
      console.warn(`Comando falló silenciosamente:`, error);
      return null;
    }
  }
}