// src/core/errors/base-error.ts
import { ErrorCategory } from "./base-error.category.enum";

export class BaseError extends Error {
  constructor(
    public readonly type: string,
    message: string,
    public readonly category: ErrorCategory,
    public readonly metadata?: Record<string, any>,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Mantiene el stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BaseError);
    }
    
    // Asegura que instanceof funcione
    Object.setPrototypeOf(this, BaseError.prototype);
  }

  public readonly timestamp: Date = new Date();

  /**
   * Serializa a objeto plano para logging/API responses
   */
  toJSON(): Record<string, any> {
    return {
      type: this.type,
      name: this.name,
      message: this.message,
      category: this.category,
      timestamp: this.timestamp,
      stack: this.stack,
      metadata: this.metadata,
      originalError: this.originalError,
    };
  }
}