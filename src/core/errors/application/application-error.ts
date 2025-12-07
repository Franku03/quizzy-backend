// src/core/errors/application/application-error.ts
import { BaseError, ErrorCategory } from '../base';

export abstract class ApplicationError extends BaseError {
  constructor(
    type: string,
    message: string,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super(type, message, ErrorCategory.APPLICATION, metadata, originalError);
    Object.setPrototypeOf(this, ApplicationError.prototype);
  }
}