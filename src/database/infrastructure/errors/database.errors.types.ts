// src/database/infrastructure/errors/database.errors.types.ts
export type DatabaseDuplicateError = {
  type: 'DatabaseDuplicateError';
  message: string;
  timestamp: Date;
  id?: string;
  field?: string;
  collection?: string;
  operation?: string;
  originalError?: any;
};

export type DatabaseNotFoundError = {
  type: 'DatabaseNotFoundError';
  message: string;
  timestamp: Date;
  id?: string;
  collection?: string;
  query?: any;
  originalError?: any;
};

export type DatabaseConnectionError = {
  type: 'DatabaseConnectionError';
  message: string;
  timestamp: Date;
  code?: string;
  host?: string;
  port?: number;
  originalError?: any;
};

export type DatabaseValidationError = {
  type: 'DatabaseValidationError';
  message: string;
  timestamp: Date;
  details: any;
  collection?: string;
  fieldErrors?: Record<string, string>;
  originalError?: any;
};

export type DatabaseQueryError = {
  type: 'DatabaseQueryError';
  message: string;
  timestamp: Date;
  query?: any;
  collection?: string;
  parameters?: any[];
  originalError?: any;
};

export type DatabaseTransactionError = {
  type: 'DatabaseTransactionError';
  message: string;
  timestamp: Date;
  operation?: string;
  transactionId?: string;
  originalError?: any;
};

export type DatabaseUnknownError = {
  type: 'DatabaseUnknownError';
  message: string;
  timestamp: Date;
  collection?: string;
  operation?: string;
  originalError?: any;
};

export type DatabaseError = 
  | DatabaseDuplicateError
  | DatabaseNotFoundError
  | DatabaseConnectionError
  | DatabaseValidationError
  | DatabaseQueryError
  | DatabaseTransactionError
  | DatabaseUnknownError;