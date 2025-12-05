// src/database/infrastructure/errors/database.errors.ts
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
import {
  isDatabaseDuplicateError,
  isDatabaseNotFoundError,
  isDatabaseValidationError,
  isDatabaseConnectionError,
  isDatabaseQueryError,
  isDatabaseTransactionError,
  isDatabaseUnknownError
} from './database.errors.type-guards';

export const isDatabaseClientError = (error: any): boolean =>
  isDatabaseDuplicateError(error) ||
  isDatabaseNotFoundError(error) ||
  isDatabaseValidationError(error);

export const isDatabaseServerError = (error: any): boolean =>
  isDatabaseConnectionError(error) ||
  isDatabaseQueryError(error) ||
  isDatabaseTransactionError(error) ||
  isDatabaseUnknownError(error);

export const isDatabaseRecoverableError = (error: any): boolean =>
  isDatabaseConnectionError(error) ||
  isDatabaseTransactionError(error);

export const isDatabaseNonRecoverableError = (error: any): boolean =>
  isDatabaseDuplicateError(error) ||
  isDatabaseValidationError(error);

export function ensureDatabaseError(error: any): DatabaseError {
  if (isDatabaseError(error)) {
    return error;
  }
  
  return {
    type: DatabaseErrorType.UNKNOWN,
    message: 'Unknown database error',
    timestamp: new Date(),
    originalError: error,
  };
}

export function assertDatabaseDuplicateError(error: any): asserts error is DatabaseDuplicateError {
  if (!isDatabaseDuplicateError(error)) {
    throw new Error(`Expected DatabaseDuplicateError, got ${error?.type}`);
  }
}

export function isDatabaseError(error: any): error is DatabaseError {
  return error != null &&
    typeof error === 'object' &&
    typeof error.type === 'string' &&
    error.type.startsWith('Database') &&
    typeof error.message === 'string' &&
    error.timestamp instanceof Date;
}