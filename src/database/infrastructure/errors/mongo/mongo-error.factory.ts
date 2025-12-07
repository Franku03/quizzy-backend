// src/database/infrastructure/errors/mongo/mongo-error-factory.ts
import { MongoError } from './mongo-error';
import { RepositoryErrorSubCategory } from '../repository-error-sub-category.enum';
import { RepositoryErrorContext } from '../repository-error-context.interface';

export class MongoErrorFactory {
  private static readonly ERROR_CODE_MAP: Record<number, RepositoryErrorSubCategory> = {
    // Duplicate Key Errors
    11000: RepositoryErrorSubCategory.DUPLICATE_KEY,
    11001: RepositoryErrorSubCategory.DUPLICATE_KEY,
    12582: RepositoryErrorSubCategory.DUPLICATE_KEY,
    
    // Validation Errors
    121: RepositoryErrorSubCategory.VALIDATION, // DocumentValidationFailure
    16755: RepositoryErrorSubCategory.VALIDATION, // InvalidIndexSpecification
    
    // Connection Errors
    6: RepositoryErrorSubCategory.CONNECTION, // HostUnreachable
    7: RepositoryErrorSubCategory.CONNECTION, // HostNotFound
    89: RepositoryErrorSubCategory.CONNECTION, // NetworkTimeout
    
    // Timeout Errors
    50: RepositoryErrorSubCategory.TIMEOUT, // MaxTimeMSExpired
    
    // Permission Errors
    13: RepositoryErrorSubCategory.PERMISSION, // Unauthorized
    18: RepositoryErrorSubCategory.PERMISSION, // AuthenticationFailed
    
    // Cursor Errors
    43: RepositoryErrorSubCategory.NOT_FOUND, // CursorNotFound
    
    // Query Errors
    2: RepositoryErrorSubCategory.QUERY_SYNTAX, // BadValue
    9: RepositoryErrorSubCategory.QUERY_SYNTAX, // FailedToParse
    14: RepositoryErrorSubCategory.QUERY_SYNTAX, // TypeMismatch
    28: RepositoryErrorSubCategory.QUERY_SYNTAX, // PathNotViable
    
    // Write Errors
    112: RepositoryErrorSubCategory.LOCK, // WriteConflict
    11600: RepositoryErrorSubCategory.CONNECTION, // InterruptedAtShutdown
    
    // Configuration Errors
    93: RepositoryErrorSubCategory.CONFIGURATION, // InvalidOptions
    
    // Resource Exhausted
    168: RepositoryErrorSubCategory.RESOURCE_EXHAUSTED, // TooManyLocks
    
    // Replication Errors
    10107: RepositoryErrorSubCategory.CONNECTION, // NotPrimary
    13436: RepositoryErrorSubCategory.CONNECTION, // NodeIsRecovering
  };

  static fromMongoError(error: any, context: RepositoryErrorContext): MongoError {
    if (!error) {
      return this.unknownError(context);
    }

    // Normalizar contexto
    const normalizedContext = this.normalizeContext(context);
    
    // Determinar categoría
    const category = this.determineCategory(error);
    
    // Construir mensaje
    const message = this.buildErrorMessage(error, category);
    
    // Construir detalles
    const detailsObj = this.buildDetailsObject(error, normalizedContext);

    return new MongoError(
      message,
      category,
      {
        ...normalizedContext,
        code: error.code?.toString(),
        details: JSON.stringify(detailsObj),
      },
      error
    );
  }

  private static normalizeContext(context: RepositoryErrorContext): RepositoryErrorContext {
    const normalized = { ...context };
    
    if (!normalized.table && normalized.repositoryName) {
      normalized.table = normalized.repositoryName
        .toLowerCase()
        .replace('repository', '');
    }
    
    return normalized;
  }

  private static determineCategory(error: any): RepositoryErrorSubCategory {
    // Verificar por código de error
    if (error.code && this.ERROR_CODE_MAP[error.code]) {
      return this.ERROR_CODE_MAP[error.code];
    }
    
    // Verificar por nombre de error
    if (error.name) {
      switch (error.name) {
        case 'MongoNetworkError':
        case 'MongoServerSelectionError':
          return RepositoryErrorSubCategory.CONNECTION;
        case 'MongoTimeoutError':
          return RepositoryErrorSubCategory.TIMEOUT;
        case 'MongoParseError':
          return RepositoryErrorSubCategory.QUERY_SYNTAX;
        case 'MongoWriteConcernError':
          return RepositoryErrorSubCategory.CONSTRAINT;
        case 'MongoBulkWriteError':
          return this.ERROR_CODE_MAP[error.code || 0] || RepositoryErrorSubCategory.VALIDATION;
        default:
          if (error.name.includes('Validation')) {
            return RepositoryErrorSubCategory.VALIDATION;
          }
      }
    }
    
    // Verificar por mensaje
    if (error.message) {
      if (error.message.includes('duplicate key')) {
        return RepositoryErrorSubCategory.DUPLICATE_KEY;
      }
      if (error.message.includes('timeout')) {
        return RepositoryErrorSubCategory.TIMEOUT;
      }
      if (error.message.includes('not found')) {
        return RepositoryErrorSubCategory.NOT_FOUND;
      }
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        return RepositoryErrorSubCategory.PERMISSION;
      }
    }
    
    return RepositoryErrorSubCategory.CONNECTION;
  }

  private static buildErrorMessage(error: any, category: RepositoryErrorSubCategory): string {
    // Mensajes específicos
    if (error.code === 11000) {
      const indexMatch = error.message?.match(/index: (\w+)/);
      return indexMatch 
        ? `Violación de unicidad en índice '${indexMatch[1]}'`
        : 'Violación de unicidad en documento';
    }
    
    if (error.code === 121) {
      return 'Error de validación en documento';
    }
    
    if (error.code === 50) {
      return 'Timeout de operación';
    }
    
    if (error.code === 13) {
      return 'No autorizado para realizar la operación';
    }
    
    if (error.name === 'MongoNetworkError') {
      return 'Error de red en conexión a MongoDB';
    }
    
    return error.message || 'Error de MongoDB desconocido';
  }

  private static buildDetailsObject(error: any, context: RepositoryErrorContext): Record<string, any> {
    const details: Record<string, any> = {
      message: error.message,
      code: error.code,
      name: error.name,
      operation: context.operation,
      collection: context.table,
    };
    
    // Agregar información específica
    if (error.writeErrors) {
      details.writeErrors = error.writeErrors;
      details.affectedDocuments = error.writeErrors.length;
    }
    
    if (error.writeConcernError) {
      details.writeConcernError = error.writeConcernError;
    }
    
    if (error.errInfo) {
      details.errorInfo = error.errInfo;
    }
    
    if (error.keyPattern) {
      details.keyPattern = error.keyPattern;
    }
    
    if (error.keyValue) {
      details.keyValue = error.keyValue;
    }
    
    return details;
  }

  // Factory methods específicos
  static notFound(context: RepositoryErrorContext, documentId?: string): MongoError {
    const message = documentId
      ? `Documento con ID '${documentId}' no encontrado en colección '${context.table}'`
      : `Documento no encontrado en colección '${context.table}'`;

    return new MongoError(
      message,
      RepositoryErrorSubCategory.NOT_FOUND,
      {
        ...context,
        details: JSON.stringify({ documentId, collection: context.table }),
      }
    );
  }

  static duplicateKey(
    context: RepositoryErrorContext,
    indexName: string,
    duplicateValue?: any,
    originalError?: any
  ): MongoError {
    return new MongoError(
      `Violación de unicidad en índice '${indexName}'`,
      RepositoryErrorSubCategory.DUPLICATE_KEY,
      {
        ...context,
        code: '11000',
        details: JSON.stringify({ 
          indexName, 
          duplicateValue,
          collection: context.table 
        }),
      },
      originalError
    );
  }

  static validation(
    context: RepositoryErrorContext,
    validationErrors: Record<string, any>,
    originalError?: any
  ): MongoError {
    return new MongoError(
      'Error de validación en documento',
      RepositoryErrorSubCategory.VALIDATION,
      {
        ...context,
        code: '121',
        details: JSON.stringify({ 
          validationErrors,
          collection: context.table 
        }),
      },
      originalError
    );
  }

  static connection(context: RepositoryErrorContext, originalError?: any): MongoError {
    return new MongoError(
      'Error de conexión a MongoDB',
      RepositoryErrorSubCategory.CONNECTION,
      {
        ...context,
        code: '7',
        details: JSON.stringify({ type: 'connection_error' }),
      },
      originalError
    );
  }

  static timeout(context: RepositoryErrorContext, operation?: string, originalError?: any): MongoError {
    return new MongoError(
      operation ? `Timeout en operación '${operation}'` : 'Timeout de operación',
      RepositoryErrorSubCategory.TIMEOUT,
      {
        ...context,
        code: '50',
        details: JSON.stringify({ operation: operation || context.operation }),
      },
      originalError
    );
  }

  static writeConflict(context: RepositoryErrorContext, originalError?: any): MongoError {
    return new MongoError(
      'Conflicto de escritura en documento',
      RepositoryErrorSubCategory.LOCK,
      {
        ...context,
        code: '112',
        details: JSON.stringify({ type: 'write_conflict' }),
      },
      originalError
    );
  }

  static permission(context: RepositoryErrorContext, operation?: string, originalError?: any): MongoError {
    return new MongoError(
      operation ? `Permiso denegado para ${operation}` : 'Permiso denegado',
      RepositoryErrorSubCategory.PERMISSION,
      {
        ...context,
        code: '13',
        details: JSON.stringify({ operation, collection: context.table }),
      },
      originalError
    );
  }

  static unknownError(context: RepositoryErrorContext): MongoError {
    return new MongoError(
      'Error desconocido de MongoDB',
      RepositoryErrorSubCategory.CONNECTION,
      context
    );
  }

  // Método para validar si es error de MongoDB
  static isMongoError(error: any): boolean {
    return error && (
      error.code !== undefined ||
      error.name?.includes('Mongo') ||
      (error.message && error.message.includes('Mongo')) ||
      (error.message && error.message.includes('mongo')) ||
      error.writeErrors !== undefined ||
      error.writeConcernError !== undefined
    );
  }

  // Método para manejo de BulkWriteError
  static fromBulkWriteError(error: any, context: RepositoryErrorContext): MongoError {
    // Tomar el primer error de escritura si existe
    const firstWriteError = error.writeErrors?.[0];
    if (firstWriteError) {
      return this.fromMongoError(firstWriteError, context);
    }
    
    return this.fromMongoError(error, context);
  }
}