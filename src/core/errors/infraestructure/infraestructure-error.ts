// src/core/errors/infrastructure/infrastructure-error.ts
import { BaseError, ErrorCategory } from '../base';

export abstract class InfrastructureError extends BaseError {
  constructor(
    type: string,
    message: string,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super(type, message, ErrorCategory.INFRASTRUCTURE, metadata, originalError);
    Object.setPrototypeOf(this, InfrastructureError.prototype);
  }
}