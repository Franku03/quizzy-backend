import { InfrastructureError } from "src/core/errors/infraestructure/infraestructure-error";

export type StorageProvider = 'cloudinary' | 's3' | 'local';
export type StorageOperation = 'upload' | 'delete' | 'generate-url' | 'transform' | 'metadata';

export abstract class StorageError extends InfrastructureError {
  constructor(
    type: string,
    message: string,
    public readonly provider: StorageProvider,
    public readonly operation: StorageOperation,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super(type, message, { provider, operation, ...metadata }, originalError);
  }
}
