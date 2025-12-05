// src/shared/domain/errors/repository-error.guards.ts
import { RepositoryError } from './repository.errors';

export const isRepositoryError = (error: any): error is RepositoryError =>
  error && 
  typeof error === 'object' && 
  error._tag === 'RepositoryError';

export const isNotFoundError = (error: any): boolean =>
  isRepositoryError(error) && error.category === 'NOT_FOUND';

export const isDuplicateKeyError = (error: any): boolean =>
  isRepositoryError(error) && error.category === 'DUPLICATE_KEY';

export const isInfrastructureError = (error: any): boolean =>
  isRepositoryError(error) && error.category === 'INFRASTRUCTURE';

export const isConnectionError = (error: any): boolean =>
  isInfrastructureError(error) && error.context.code === 'NETWORK_ERROR';

export const isTimeoutError = (error: any): boolean =>
  isInfrastructureError(error) && error.context.code === 'TIMEOUT';

export const isValidationError = (error: any): boolean =>
  isInfrastructureError(error) && error.context.details?.validationErrors !== undefined;