// src/kahoots/domain/errors/kahoot-domain-error.guards.ts
import { KahootNotFoundError } from './kahoot-domain.errors';
import { InvalidKahootDataError } from './kahoot-domain.errors';
import { UnauthorizedKahootError } from './kahoot-domain.errors';

// Type guard individuales
export function isKahootNotFoundError(error: any): error is KahootNotFoundError {
  return error && error.type === 'KahootNotFound';
}

export function isInvalidKahootDataError(error: any): error is InvalidKahootDataError {
  return error && error.type === 'InvalidKahootData';
}

export function isUnauthorizedKahootError(error: any): error is UnauthorizedKahootError {
  return error && error.type === 'UnauthorizedKahoot';
}

// Type guard combinado
export function isKahootDomainError(error: any): error is 
  | KahootNotFoundError 
  | InvalidKahootDataError 
  | UnauthorizedKahootError {
  return (
    isKahootNotFoundError(error) ||
    isInvalidKahootDataError(error) ||
    isUnauthorizedKahootError(error)
  );
}