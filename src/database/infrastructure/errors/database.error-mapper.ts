// src/database/infrastructure/errors/database.error-mapper.ts
import {
  DatabaseError,
  DatabaseDuplicateError,
  DatabaseNotFoundError,
  DatabaseConnectionError,
  DatabaseValidationError,
  DatabaseQueryError,
  DatabaseTransactionError,
  DatabaseUnknownError
} from './database.errors.types';
import { DatabaseErrorType } from './database.errors.constants';

export interface ErrorMappingOptions {
  collection?: string;
  id?: string;
  field?: string;
  operation?: string;
  query?: any;
}

export class DatabaseErrorMapper {
  static mapMongoError(error: any, options: ErrorMappingOptions = {}): DatabaseError {
    const { collection, id, field, operation, query } = options;
    const timestamp = new Date();

    if (error.code === 11000) {
      const duplicateField = error.keyPattern 
        ? Object.keys(error.keyPattern)[0] 
        : field || 'id';
      
      const dbError: DatabaseDuplicateError = {
        type: DatabaseErrorType.DUPLICATE,
        message: `Duplicate value for field '${duplicateField}' in ${collection || 'collection'}`,
        timestamp,
        originalError: error,
        id,
        field: duplicateField,
        collection,
        operation: operation || 'upsert',
      };
      
      return dbError;
    }

    if (error.name === 'ValidationError') {
      const dbError: DatabaseValidationError = {
        type: DatabaseErrorType.VALIDATION,
        message: `Validation failed for ${collection || 'document'}: ${error.message}`,
        timestamp,
        originalError: error,
        details: error.errors || error.message,
        collection,
        fieldErrors: this.extractFieldErrors(error),
      };
      
      return dbError;
    }

    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      const dbError: DatabaseConnectionError = {
        type: DatabaseErrorType.CONNECTION,
        message: `Database connection failed for ${collection || 'operation'}`,
        timestamp,
        originalError: error,
        code: error.code,
        host: error.host,
        port: error.port,
      };
      
      return dbError;
    }

    if (error.name === 'CastError') {
      const dbError: DatabaseValidationError = {
        type: DatabaseErrorType.VALIDATION,
        message: `Invalid value for field '${error.path}': ${error.value}`,
        timestamp,
        originalError: error,
        details: { path: error.path, value: error.value },
        collection,
        fieldErrors: { [error.path]: `Invalid value: ${error.value}` },
      };
      
      return dbError;
    }

    if (error.name?.includes('Mongo')) {
      const dbError: DatabaseUnknownError = {
        type: DatabaseErrorType.UNKNOWN,
        message: `Database error occurred in ${collection || 'operation'}`,
        timestamp,
        originalError: error,
        collection,
        operation: operation || 'unknown',
      };
      
      return dbError;
    }

    const dbError: DatabaseUnknownError = {
      type: DatabaseErrorType.UNKNOWN,
      message: 'Unexpected database error',
      timestamp,
      originalError: error,
      collection,
      operation: operation || 'unknown',
    };
    
    return dbError;
  }

  private static extractFieldErrors(error: any): Record<string, string> {
    if (!error.errors) return {};
    
    const fieldErrors: Record<string, string> = {};
    for (const [field, err] of Object.entries(error.errors)) {
      if (err && typeof err === 'object' && 'message' in err) {
        fieldErrors[field] = (err as any).message;
      }
    }
    return fieldErrors;
  }
}