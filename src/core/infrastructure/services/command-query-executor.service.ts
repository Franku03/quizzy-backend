// src/shared/services/command-query-executor.service.ts

import { Injectable } from '@nestjs/common';
import { CommandBus } from 'src/core/infrastructure/cqrs/buses/command-bus';
import { QueryBus } from 'src/core/infrastructure/cqrs/buses/query-bus';
import { Either } from 'src/core/types/either';
import { ErrorData } from 'src/core/types';

@Injectable()
export class CommandQueryExecutorService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  /**
   * Ejecuta un comando y retorna el resultado (T) o lanza el ErrorData en caso de fallo.
   * Maneja: Either<ErrorData, T> y Optional<Error>
   */
  async executeCommand<T>(command: any): Promise<T> {
    const result = await this.commandBus.execute(command);

    // Si el handler devuelve Either<ErrorData, T>
    if (result && typeof result.isLeft === 'function') {
      const either = result as Either<ErrorData, T>;
      if (either.isLeft()) {
        throw either.getLeft(); // Lanza ErrorData
      }
      return either.getRight();
    }

    // También maneja Optional<Error> (para compatibilidad con código existente)
    if (result && typeof result.hasValue === 'function') {
      const optional = result as any;
      if (optional.hasValue()) {
        throw optional.getValue(); // Lanza Error
      }
      return result as T;
    }

    return result as T;
  }

  /**
   * Ejecuta una query y retorna el resultado (T) o lanza el ErrorData en caso de fallo.
   * Maneja: Either<ErrorData, T> y Optional<Error>
   */
  async executeQuery<T>(query: any): Promise<T> {
    const result = await this.queryBus.execute(query);

    // Si el handler devuelve Either<ErrorData, T>
    if (result && typeof result.isLeft === 'function') {
      const either = result as Either<ErrorData, T>;
      if (either.isLeft()) {
        throw either.getLeft(); // Lanza ErrorData
      }
      return either.getRight();
    }

    // También maneja Optional<Error> (para compatibilidad con código existente)
    if (result && typeof result.hasValue === 'function') {
      const optional = result as any;
      if (optional.hasValue()) {
        throw optional.getValue(); // Lanza Error
      }
      return result as T;
    }

    return result as T;
  }

  /**
   * Ejecuta comandos en paralelo
   */
  async executeCommandsInParallel<T>(commands: any[]): Promise<T[]> {
    const promises = commands.map(cmd => this.executeCommand<T>(cmd));
    return Promise.all(promises);
  }

  /**
   * Ejecuta queries en paralelo
   */
  async executeQueriesInParallel<T>(queries: any[]): Promise<T[]> {
    const promises = queries.map(query => this.executeQuery<T>(query));
    return Promise.all(promises);
  }
}