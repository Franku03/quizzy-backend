// src/database/infrastructure/errors/database.errors.type-guards.ts
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

export const isDatabaseError = (error: any): error is DatabaseError => {
  return error != null &&
    typeof error === 'object' &&
    typeof error.type === 'string' &&
    error.type.startsWith('Database') &&
    typeof error.message === 'string' &&
    error.timestamp instanceof Date;
};

const createDatabaseTypeGuard = <T extends DatabaseError>(
  expectedType: string
): ((error: any) => error is T) => {
  return (error: any): error is T => {
    return error != null &&
      typeof error === 'object' &&
      error.type === expectedType &&
      typeof error.message === 'string' &&
      error.timestamp instanceof Date;
  };
};

export const isDatabaseDuplicateError = createDatabaseTypeGuard<DatabaseDuplicateError>(
  DatabaseErrorType.DUPLICATE
);

export const isDatabaseNotFoundError = createDatabaseTypeGuard<DatabaseNotFoundError>(
  DatabaseErrorType.NOT_FOUND
);

export const isDatabaseConnectionError = createDatabaseTypeGuard<DatabaseConnectionError>(
  DatabaseErrorType.CONNECTION
);

export const isDatabaseValidationError = createDatabaseTypeGuard<DatabaseValidationError>(
  DatabaseErrorType.VALIDATION
);

export const isDatabaseQueryError = createDatabaseTypeGuard<DatabaseQueryError>(
  DatabaseErrorType.QUERY
);

export const isDatabaseTransactionError = createDatabaseTypeGuard<DatabaseTransactionError>(
  DatabaseErrorType.TRANSACTION
);

export const isDatabaseUnknownError = createDatabaseTypeGuard<DatabaseUnknownError>(
  DatabaseErrorType.UNKNOWN
);

export function toDatabaseError(error: any): DatabaseError | null {
  try {
    if (isDatabaseError(error)) {
      return error;
    }
    
    if (error && typeof error === 'object') {
      const baseError: DatabaseError = {
        type: DatabaseErrorType.UNKNOWN,
        message: error.message || 'Unknown database error',
        timestamp: new Date(),
        originalError: error,
      };
      
      if (error.code === 11000) {
        (baseError as any).type = DatabaseErrorType.DUPLICATE;
      }
      
      return baseError;
    }
    
    return null;
  } catch {
    return null;
  }
}