import { DatabaseError, DatabaseErrorType } from './databasa.errors';

export interface ErrorMappingOptions {
  collection?: string;
  id?: string;
  field?: string;
  operation?: string;
}

export class DatabaseErrorMapper {
  static mapMongoError(
    error: any, 
    options: ErrorMappingOptions = {}
  ): DatabaseError {
    const { collection, id, field, operation } = options;

    // Duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      const duplicateField = error.keyPattern 
        ? Object.keys(error.keyPattern)[0] 
        : field;
      
      return {
        type: DatabaseErrorType.DUPLICATE,
        message: `Duplicate value for field '${duplicateField}' in ${collection || 'collection'}`,
        id,
        field: duplicateField,
        collection,
      };
    }

    // Validation error
    if (error.name === 'ValidationError') {
      return {
        type: DatabaseErrorType.VALIDATION,
        message: `Validation failed for ${collection || 'document'}: ${error.message}`,
        details: error.errors || error.message,
        collection,
      };
    }

    // Network/connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return {
        type: DatabaseErrorType.CONNECTION,
        message: `Database connection failed for ${collection || 'operation'}`,
        code: error.code,
      };
    }

    // Cast error (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
      return {
        type: DatabaseErrorType.VALIDATION,
        message: `Invalid value for field '${error.path}': ${error.value}`,
        details: { path: error.path, value: error.value },
        collection,
      };
    }

    // Query execution error
    if (error.name === 'MongoServerError') {
      return {
        type: DatabaseErrorType.QUERY,
        message: `Query execution failed on ${collection || 'database'}`,
        query: error.message,
        collection,
      };
    }

    // Transaction error
    if (error.name === 'MongoTransactionError') {
      return {
        type: DatabaseErrorType.TRANSACTION,
        message: `Transaction failed for operation: ${operation || 'unknown'}`,
        operation,
      };
    }

    // Any other MongoDB error
    if (error.name?.includes('Mongo')) {
      return {
        type: DatabaseErrorType.UNKNOWN,
        message: `Database error occurred in ${collection || 'operation'}`,
        originalError: error,
        collection,
      };
    }

    // Generic unknown error
    return {
      type: DatabaseErrorType.UNKNOWN,
      message: 'Unexpected database error',
      originalError: error,
      collection,
    };
  }

  // Para PostgreSQL (
  /*static mapPostgresError(
    error: any,
    options: ErrorMappingOptions = {}
  ): DatabaseError {

  }*/
}