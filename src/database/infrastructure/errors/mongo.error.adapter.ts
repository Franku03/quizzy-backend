// src/shared/infrastructure/persistence/mongodb/mongo-error.adapter.ts
import {
  DatabaseError,
  DatabaseErrorMapper,
  isDatabaseError,
  isDatabaseDuplicateError,
  isDatabaseNotFoundError,
  isDatabaseValidationError,
  isDatabaseConnectionError,
  isDatabaseQueryError,
} from '../errors';
import {RepositoryErrorFactory} from '../../domain/repository/repository-factory.error';
import { RepositoryError } from '../../domain/repository/repository.errors';
import { DatabaseConnectionError, DatabaseDuplicateError, DatabaseNotFoundError, DatabaseQueryError, DatabaseValidationError } from './database.errors.types';

export class MongoErrorAdapter {
  static toRepositoryError(
    error: any,
    collection: string,
    operation: string,
    documentId?: string
  ): RepositoryError {
    try {
      if (isDatabaseError(error)) {
        return this.mapDatabaseError(error, collection, operation, documentId);
      }

      const dbError = DatabaseErrorMapper.mapMongoError(error, {
        collection,
        id: documentId,
        operation: this.normalizeOperation(operation),
      });

      return this.mapDatabaseError(dbError, collection, operation, documentId);

    } catch (adapterError) {
      return RepositoryErrorFactory.create(
        'INFRASTRUCTURE',
        `Error en el repositorio: ${error.message || 'Error desconocido'}`,
        collection,
        operation,
        {
          documentId,
          code: 'ADAPTER_ERROR',
          details: {
            originalError: error,
            adapterError,
          }
        }
      );
    }
  }

  private static mapDatabaseError(
    dbError: DatabaseError,
    collection: string,
    operation: string,
    documentId?: string
  ): RepositoryError {
    if (isDatabaseNotFoundError(dbError)) {
      return this.handleNotFoundError(dbError, collection, documentId);
    }

    if (isDatabaseDuplicateError(dbError)) {
      return this.handleDuplicateError(dbError, collection, operation);
    }

    if (isDatabaseValidationError(dbError)) {
      return this.handleValidationError(dbError, collection, operation, documentId);
    }

    if (isDatabaseConnectionError(dbError)) {
      return this.handleConnectionError(dbError, collection, operation);
    }

    if (isDatabaseQueryError(dbError)) {
      return this.handleQueryError(dbError, collection, operation, documentId);
    }

    return this.handleGenericDatabaseError(dbError, collection, operation, documentId);
  }

  private static handleNotFoundError(
    error: DatabaseNotFoundError,
    collection: string,
    documentId?: string
  ): RepositoryError {
    return RepositoryErrorFactory.notFound(
      collection,
      documentId || error.id || 'unknown'
    );
  }

  private static handleDuplicateError(
    error: DatabaseDuplicateError,
    collection: string,
    operation: string
  ): RepositoryError {
    const keyPattern = error.originalError?.keyPattern || 
                       this.extractKeyPatternFromMessage(error.message);
    
    return RepositoryErrorFactory.duplicateKey(
      collection,
      operation,
      keyPattern || { [error.field || 'id']: 1 },
      error.id
    );
  }

  private static handleValidationError(
    error: DatabaseValidationError,
    collection: string,
    operation: string,
    documentId?: string
  ): RepositoryError {
    return RepositoryErrorFactory.validationError(
      collection,
      operation,
      error.fieldErrors || this.extractValidationErrors(error),
      documentId
    );
  }

  private static handleConnectionError(
    error: DatabaseConnectionError,
    collection: string,
    operation: string
  ): RepositoryError {
    return RepositoryErrorFactory.connectionError(collection, operation);
  }

  private static handleQueryError(
    error: DatabaseQueryError,
    collection: string,
    operation: string,
    documentId?: string
  ): RepositoryError {
    return RepositoryErrorFactory.create(
      'INFRASTRUCTURE',
      `Error en consulta a ${collection}`,
      collection,
      operation,
      {
        documentId,
        code: error.originalError?.code?.toString(),
        details: {
          query: error.query,
          parameters: error.parameters,
          originalError: error.originalError
        }
      }
    );
  }

  private static handleGenericDatabaseError(
    error: DatabaseError,
    collection: string,
    operation: string,
    documentId?: string
  ): RepositoryError {
    const errorWithProps = error as any;
    
    return RepositoryErrorFactory.create(
      'INFRASTRUCTURE',
      error.message,
      collection,
      operation,
      {
        documentId,
        code: errorWithProps.code,
        details: {
          type: error.type,
          originalError: errorWithProps.originalError,
          collection: errorWithProps.collection,
          operation: errorWithProps.operation
        }
      }
    );
  }

  private static extractKeyPatternFromMessage(message: string): any {
    const match = message.match(/field\s+'([^']+)'/);
    if (match) {
      return { [match[1]]: 1 };
    }
    return {};
  }

  private static extractValidationErrors(error: DatabaseValidationError): Record<string, string> {
    if (error.fieldErrors) {
      return error.fieldErrors;
    }

    if (error.details && typeof error.details === 'object') {
      const fieldErrors: Record<string, string> = {};
      
      if (Array.isArray(error.details.errors)) {
        error.details.errors.forEach((err: any) => {
          if (err.path && err.message) {
            fieldErrors[err.path] = err.message;
          }
        });
      }
      
      return fieldErrors;
    }

    return { general: error.message };
  }

  private static normalizeOperation(operation: string): string {
    const op = operation.toLowerCase();
    
    if (op.includes('find') || op.includes('get') || op.includes('query')) {
      return op.includes('all') ? 'findAll' : 'findById';
    }
    
    if (op.includes('insert') || op.includes('create')) return 'insert';
    if (op.includes('update') || op.includes('modify')) return 'update';
    if (op.includes('save') || op.includes('persist')) return 'save';
    if (op.includes('delete') || op.includes('remove')) return 'delete';
    if (op.includes('upsert')) return 'upsert';
    
    return 'unknown';
  }
}