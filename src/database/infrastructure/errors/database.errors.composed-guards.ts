import {
  isDatabaseDuplicateError,
  isDatabaseNotFoundError,
  isDatabaseValidationError,
  isDatabaseConnectionError,
  isDatabaseQueryError,
  isDatabaseTransactionError,
  isDatabaseUnknownError
} from './database.errors.type-guards';

// ========== GUARDS COMPUESTOS ==========
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
  isDatabaseConnectionError(error) ||  // Se puede reconectar
  isDatabaseTransactionError(error);   // Se puede reintentar

export const isDatabaseNonRecoverableError = (error: any): boolean =>
  isDatabaseDuplicateError(error) ||   // Duplicidad no se recupera con reintento
  isDatabaseValidationError(error);    // Datos inválidos no mejoran con reintento