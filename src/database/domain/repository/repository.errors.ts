// src/shared/domain/errors/repository-error.ts

export type RepositoryError = {
  readonly _tag: 'RepositoryError';
  readonly message: string;
  readonly timestamp: Date;
  readonly category: RepositoryErrorCategory;
  readonly context: RepositoryErrorContext;
};

// Tipos auxiliares
export type RepositoryErrorCategory =
  | 'NOT_FOUND'       // Documento no existe
  | 'DUPLICATE_KEY'   // Violación de índice único
  | 'INFRASTRUCTURE'; // Network, timeout, validation

export type RepositoryErrorContext = {
  readonly collection: string; // Collection name en MongoDB
  readonly documentId?: string; // _id del documento
  readonly operation: string;  // find, insert, update, delete
  readonly code?: string; // MongoDB error code 
  readonly keyPattern?: any;
  readonly details?: Record<string, any>;
};