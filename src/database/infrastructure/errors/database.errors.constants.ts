// src/database/infrastructure/errors/database.errors.constants.ts
export const DatabaseErrorType = {
  DUPLICATE: 'DatabaseDuplicateError' as const,
  NOT_FOUND: 'DatabaseNotFoundError' as const,
  CONNECTION: 'DatabaseConnectionError' as const,
  VALIDATION: 'DatabaseValidationError' as const,
  QUERY: 'DatabaseQueryError' as const,
  TRANSACTION: 'DatabaseTransactionError' as const,
  UNKNOWN: 'DatabaseUnknownError' as const,
} as const;