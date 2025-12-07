// src/core/errors/error-type-guards.ts
import { DomainError } from './domain/domain-error';
import { ApplicationError } from './application/application-error';
import { InfrastructureError } from './infraestructure/infraestructure-error';

export function isDomainError(error: any): error is DomainError {
  return error && error.category === 'DOMAIN';
}

export function isApplicationError(error: any): error is ApplicationError {
  return error && error.category === 'APPLICATION';
}

export function isInfrastructureError(error: any): error is InfrastructureError {
  return error && error.category === 'INFRASTRUCTURE';
}

export function isBaseError(error: any): error is 
  | DomainError 
  | ApplicationError 
  | InfrastructureError {
  return isDomainError(error) || isApplicationError(error) || isInfrastructureError(error);
}