// src/database/infrastructure/errors/repository-error-context.interface.ts
export interface RepositoryErrorContext {
  readonly collection?: string;
  readonly table?: string;
  readonly documentId?: string;
  documentIds?: string[];
  readonly recordId?: string;
  readonly repositoryName?: string;
  readonly operation: string;
  readonly query?: any;
  readonly constraints?: string[];
  readonly code?: string;
  readonly details?: any;
  readonly column?: string;
}