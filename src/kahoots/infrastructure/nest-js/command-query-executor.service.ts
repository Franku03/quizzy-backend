// src/shared/services/command-query-executor.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// Importaciones Canónicas
import { Either } from 'src/core/types/either';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { IDomainErrorContext } from 'src/core/errors/interface/context/i-error-domain.context';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';


@Injectable()
export class CommandQueryExecutorService {
  private readonly logger = new Logger(CommandQueryExecutorService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    // ❌ ELIMINADO: Inyección de ErrorMappingService (ya no es necesaria)
  ) { }

  // ====================================================================
  // 🎯 MÉTODOS BASE (Comandos y Queries - Lanza error si Either es Left)
  // ====================================================================

  /**
   * Ejecuta un comando (que devuelve Either<ErrorData, T>) y retorna el resultado (T) 
   * o lanza el ErrorData en caso de fallo.
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

    return result as T;
  }

  /**
   * Ejecuta una query (que devuelve Either<ErrorData, T>) y retorna el resultado (T) 
   * o lanza el ErrorData en caso de fallo.
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

    return result as T;
  }

  // ====================================================================
  // 🔍 MÉTODOS DE BÚSQUEDA (Reemplaza executeQueryOptional)
  // ====================================================================

  /**
   * Ejecuta una query que retorna T | null (el estándar de DAO) y lanza NotFound 
   * si el resultado es null.
   */
  async executeQueryRequired<T>(
    query: any,
    resourceId: string,
    domainObjectType: string = 'Resource'
  ): Promise<T> {
    // La queryHandler debe retornar Either<ErrorData, T | null>
    const result = await this.executeQuery<T | null>(query);

    if (result === null) {
      // Creamos un ErrorData canónico de Dominio usando el helper:
      const context: IDomainErrorContext = createDomainContext(
        domainObjectType,
        'read', // El campo 'operation' ahora está definido
        {
          domainObjectId: resourceId,
          // intendedAction: 'read' no es necesario aquí, ya que 'operation' ('read') lo establece por defecto.
        }
      );
      throw DomainErrorFactory.notFound(context);
    }

    return result;
  }

  // ====================================================================
  // 📦 MÉTODOS RAW (Devolver Either sin procesar)
  // ====================================================================

  /**
   * Ejecuta un comando y devuelve el Either sin procesar
   */
  async executeCommandRaw<T>(command: any): Promise<Either<ErrorData, T>> {
    return this.commandBus.execute(command) as Promise<Either<ErrorData, T>>;
  }

  /**
   * Ejecuta una query y devuelve el Either sin procesar
   */
  async executeQueryRaw<T>(query: any): Promise<Either<ErrorData, T>> {
    return this.queryBus.execute(query) as Promise<Either<ErrorData, T>>;
  }

  // ====================================================================
  // ⚙️ MÉTODOS AUXILIARES (Utilidades)
  // ====================================================================

  // ❌ MÉTODO ELIMINADO: executeCommandSilently

  /**
   * Ejecuta comandos en paralelo
   */
  async executeCommandsInParallel<T>(commands: any[]): Promise<T[]> {
    const promises = commands.map(cmd => this.executeCommand<T>(cmd));
    return Promise.all(promises);
  }

  /**
   * Verifica si un error es transitorio (retryable)
   */
  private isTransientError(error: ErrorData): boolean {
    // Usamos la capa y los códigos canónicos para determinar la transitoriedad
    if (error.layer === ErrorLayer.INFRASTRUCTURE || error.layer === ErrorLayer.EXTERNAL) {
      const code = error.code;
      // Códigos transitorios:
      return code.includes('CONNECTION') || code.includes('TIMEOUT') || code.includes('UNAVAILABLE') || code.includes('EXHAUSTED');
    }
    return false;
  }

  /**
   * Ejecuta un comando con retry
   */
  async executeCommandWithRetry<T>(
    command: any,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: ErrorData | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.executeCommand<T>(command);
      } catch (error) {
        if (!(error instanceof ErrorData)) {
          // Relanzar si no es un ErrorData esperado (fallo de programación)
          throw error;
        }

        lastError = error;

        // Solo reintentar si es error transitorio
        if (!this.isTransientError(error)) {
          throw error;
        }

        if (i < maxRetries - 1) {
          this.logger.warn(`Transient error on attempt ${i + 1}. Retrying in ${delayMs * Math.pow(2, i)}ms. Code: ${error.code}`);
          await this.delay(delayMs * Math.pow(2, i)); // Exponential backoff
        }
      }
    }

    // Si agotamos los reintentos, lanzamos el último error transitorio.
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}