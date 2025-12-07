// src/shared/services/command-query-executor.service.ts
import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Either } from 'src/core/types/either';
import { Optional } from 'src/core/types/optional';
import { BaseError, ErrorCategory } from 'src/core/errors/base';
import { App } from 'supertest/types';

@Injectable()
export class CommandQueryExecutorService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Ejecuta un comando y retorna el resultado o lanza error
   */
  async executeCommand<T>(command: any): Promise<T> {
    const result = await this.commandBus.execute(command);
    
    if (Either.isEither(result)) {
      const either = result as Either<BaseError, T>;
      if (either.isLeft()) {
        throw either.getLeft();
      }
      return either.getRight();
    }
    
    return result as T;
  }

  /**
   * Ejecuta una query y retorna el resultado o lanza error
   */
  async executeQuery<T>(query: any): Promise<T> {
    const result = await this.queryBus.execute(query);
    
    if (Either.isEither(result)) {
      const either = result as Either<BaseError, T>;
      if (either.isLeft()) {
        throw either.getLeft();
      }
      return either.getRight();
    }
    
    return result as T;
  }

  /**
   * Ejecuta una query que retorna Optional y maneja NotFound
   */
  async executeQueryOptional<T>(
    query: any,
    resourceId: string,
    resourceType: string = 'Resource'
  ): Promise<T> {
    const result = await this.executeQuery<Optional<T>>(query);
    
    if (!result.hasValue()) {
      throw new BaseError(
        'NotFoundError',
        `${resourceType} "${resourceId}" not found`,
        ErrorCategory.DOMAIN,
        { resourceId, resourceType }
      );
    }
    
    return result.getValue();
  }

  /**
   * Ejecuta una query y retorna el Optional (sin lanzar error si está vacío)
   */
  async executeQueryToOptional<T>(query: any): Promise<Optional<T>> {
    try {
      return await this.executeQuery<Optional<T>>(query);
    } catch (error) {
      // Si es NotFoundError, retornar Optional vacío
      if (error instanceof BaseError && error.type === 'NotFoundError') {
        return new Optional<T>();
      }
      throw error;
    }
  }

  /**
   * Ejecuta un comando y devuelve el Either sin procesar
   */
  async executeCommandRaw<E extends BaseError, T>(command: any): Promise<Either<E, T>> {
    return this.commandBus.execute(command) as Promise<Either<E, T>>;
  }

  /**
   * Ejecuta una query y devuelve el Either sin procesar
   */
  async executeQueryRaw<E extends BaseError, T>(query: any): Promise<Either<E, T>> {
    return this.queryBus.execute(query) as Promise<Either<E, T>>;
  }

  /**
   * Ejecuta comando silenciosamente (retorna null en caso de error)
   */
  async executeCommandSilently<T>(
    command: any,
    onError?: (error: BaseError) => void
  ): Promise<T | null> {
    try {
      return await this.executeCommand<T>(command);
    } catch (error) {
      if (error instanceof BaseError) {
        onError?.(error);
      } else {
        // Convertir error desconocido a BaseError
        const baseError = new BaseError(
          'UnknownError',
          String(error),
          ErrorCategory.APPLICATION,
          { originalError: error }
        );
        onError?.(baseError);
      }
      return null;
    }
  }

  /**
   * Ejecuta múltiples comandos en paralelo
   */
  async executeCommandsInParallel<T>(commands: any[]): Promise<T[]> {
    const promises = commands.map(cmd => this.executeCommand<T>(cmd));
    return Promise.all(promises);
  }

  /**
   * Verifica si un error es transitorio
   */
  private isTransientError(error: BaseError): boolean {
    return error.category === 'INFRASTRUCTURE' && 
           (error.metadata?.isTransient === true ||
            error.type.toLowerCase().includes('timeout') ||
            error.type.toLowerCase().includes('connection'));
  }

  /**
   * Ejecuta un comando con retry
   */
  async executeCommandWithRetry<T>(
    command: any,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: BaseError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.executeCommand<T>(command);
      } catch (error) {
        if (!(error instanceof BaseError)) {
          throw error;
        }
        
        lastError = error;
        
        // Solo reintentar si es error transitorio
        if (!this.isTransientError(error)) {
          throw error;
        }
        
        if (i < maxRetries - 1) {
          await this.delay(delayMs * Math.pow(2, i)); // Exponential backoff
        }
      }
    }
    
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Ejecuta una operación con tiempo de espera
   */
  async executeWithTimeout<T>(
    command: any,
    timeoutMs: number = 10000
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new BaseError(
          'TimeoutError',
          `Operation timed out after ${timeoutMs}ms`,
          ErrorCategory.INFRASTRUCTURE,
          { timeoutMs }
        ));
      }, timeoutMs);
    });

    const operationPromise = this.executeCommand<T>(command);
    
    return Promise.race([operationPromise, timeoutPromise]);
  }
}