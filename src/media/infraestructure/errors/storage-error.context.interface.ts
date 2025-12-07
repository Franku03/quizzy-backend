// src/media/infrastructure/errors/storage-error-context.interface.ts
export interface StorageErrorContext {
  readonly publicId?: string;
  readonly storageKey?: string;
  readonly folder?: string;
  readonly operation?: string;
  readonly fileSize?: number;
  readonly mimeType?: string;
  readonly code?: string;
  readonly details?: any;
  readonly transformations?: Record<string, any>;
}

