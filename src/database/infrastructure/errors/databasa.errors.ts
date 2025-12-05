export type DatabaseError = 
  | { 
      type: 'DuplicateError'; 
      message: string; 
      id?: string;
      field?: string;
      collection?: string;
    }
  | { 
      type: 'NotFoundError'; 
      message: string; 
      id?: string;
      collection?: string;
    }
  | { 
      type: 'ConnectionError'; 
      message: string;
      code?: string;
    }
  | { 
      type: 'ValidationError'; 
      message: string; 
      details: any;
      collection?: string;
    }
  | { 
      type: 'QueryError'; 
      message: string;
      query?: any;
      collection?: string;
    }
  | { 
      type: 'TransactionError'; 
      message: string;
      operation?: string;
    }
  | { 
      type: 'UnknownDatabaseError'; 
      message: string; 
      originalError: any;
      collection?: string;
    };

export const DatabaseErrorType = {
  DUPLICATE: 'DuplicateError' as const,
  NOT_FOUND: 'NotFoundError' as const,
  CONNECTION: 'ConnectionError' as const,
  VALIDATION: 'ValidationError' as const,
  QUERY: 'QueryError' as const,
  TRANSACTION: 'TransactionError' as const,
  UNKNOWN: 'UnknownDatabaseError' as const,
};