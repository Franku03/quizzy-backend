// src/shared/domain/errors/repository-error.factory.ts
import { 
  RepositoryError, 
  RepositoryErrorCategory, 
  RepositoryErrorContext 
} from './repository.errors';

export class RepositoryErrorFactory {
  static create(
    category: RepositoryErrorCategory,
    message: string,
    collection: string,
    operation: string,
    context?: Omit<RepositoryErrorContext, 'collection' | 'operation'>
  ): RepositoryError {
    return {
      _tag: 'RepositoryError',
      message,
      timestamp: new Date(),
      category,
      context: {
        collection,
        operation,
        documentId: context?.documentId,
        code: context?.code,
        keyPattern: context?.keyPattern,
        details: context?.details
      }
    };
  }

  static notFound(collection: string, documentId: string): RepositoryError {
    return this.create(
      'NOT_FOUND',
      `Documento no encontrado en ${collection}`,
      collection,
      'find',
      { documentId }
    );
  }

  static duplicateKey(
    collection: string, 
    operation: string, 
    keyPattern: any,
    documentId?: string
  ): RepositoryError {
    return this.create(
      'DUPLICATE_KEY',
      `Violación de clave única en ${collection}`,
      collection,
      operation,
      { 
        documentId, 
        code: '11000',
        keyPattern 
      }
    );
  }

  static validationError(
    collection: string,
    operation: string,
    validationErrors: Record<string, string>,
    documentId?: string
  ): RepositoryError {
    return this.create(
      'INFRASTRUCTURE',
      `Error de validación en ${collection}`,
      collection,
      operation,
      { 
        documentId,
        details: { validationErrors }
      }
    );
  }

  static connectionError(collection: string, operation: string): RepositoryError {
    return this.create(
      'INFRASTRUCTURE',
      `Error de conexión con MongoDB`,
      collection,
      operation,
      { code: 'NETWORK_ERROR' }
    );
  }

  static timeoutError(collection: string, operation: string): RepositoryError {
    return this.create(
      'INFRASTRUCTURE',
      `Timeout en operación con MongoDB`,
      collection,
      operation,
      { code: 'TIMEOUT' }
    );
  }
}