// src/core/errors/domain/domain-error.ts

import { BaseError } from "../base/base-error";
import { ErrorCategory } from "../base/base-error.category.enum";

//Base de todos los errores de dominio
export abstract class DomainError extends BaseError {
  constructor(
    type: string,
    message: string,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super(type, message, ErrorCategory.DOMAIN, metadata, originalError);
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}