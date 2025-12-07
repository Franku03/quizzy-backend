// src/kahoots/application/errors/kahoot-application.errors.ts
import { ApplicationError } from 'src/core/errors/application/application-error';

export class CreateKahootError extends ApplicationError {
  constructor(
    message: string,
    public readonly userId?: string,
    context?: Record<string, any>,
    originalError?: any
  ) {
    super('CreateKahootError', message, { userId, ...context }, originalError);
    Object.setPrototypeOf(this, CreateKahootError.prototype);
  }
}

export class CreateKahootValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly validationDetails?: Record<string, string[]>,
    public readonly userId?: string,
    context?: Record<string, any>,
    originalError?: any
  ) {
    super(
      'CreateKahootValidationError', 
      message, 
      { validationDetails, userId, ...context }, 
      originalError
    );
    Object.setPrototypeOf(this, CreateKahootValidationError.prototype);
  }
}

export class UpdateKahootError extends ApplicationError {
  constructor(
    message: string,
    public readonly kahootId?: string,
    public readonly userId?: string,
    context?: Record<string, any>,
    originalError?: any
  ) {
    super(
      'UpdateKahootError', 
      message, 
      { kahootId, userId, ...context }, 
      originalError
    );
    Object.setPrototypeOf(this, UpdateKahootError.prototype);
  }
}

export class UpdateKahootValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly validationDetails?: Record<string, string[]>,
    public readonly kahootId?: string,
    public readonly userId?: string,
    context?: Record<string, any>,
    originalError?: any
  ) {
    super(
      'UpdateKahootValidationError', 
      message, 
      { validationDetails, kahootId, userId, ...context }, 
      originalError
    );
    Object.setPrototypeOf(this, UpdateKahootValidationError.prototype);
  }
}

export class DeleteKahootError extends ApplicationError {
  constructor(
    message: string,
    public readonly kahootId?: string,
    public readonly userId?: string,
    context?: Record<string, any>,
    originalError?: any
  ) {
    super(
      'DeleteKahootError', 
      message, 
      { kahootId, userId, ...context }, 
      originalError
    );
    Object.setPrototypeOf(this, DeleteKahootError.prototype);
  }
}

export class GetKahootByIdError extends ApplicationError {
  constructor(
    message: string,
    public readonly kahootId?: string,
    context?: Record<string, any>,
    originalError?: any
  ) {
    super(
      'GetKahootByIdError', 
      message, 
      { kahootId, ...context }, 
      originalError
    );
    Object.setPrototypeOf(this, GetKahootByIdError.prototype);
  }
}

// Tipo unión para todos los errores de aplicación de Kahoot
export type KahootApplicationError = 
  | CreateKahootError
  | CreateKahootValidationError
  | UpdateKahootError
  | UpdateKahootValidationError
  | DeleteKahootError
  | GetKahootByIdError;