// src/kahoots/application/errors/kahoot-application.errors.ts
import { RepositoryError } from 'src/database/domain/repository';
import { 
  KahootNotFoundError, 
  InvalidKahootDataError, 
  UnauthorizedError 
} from '../../domain/errors/kahoot-domain.errors';

// Tipo base para errores inesperados
export type UnexpectedError = {
  type: 'UnexpectedError';
  message: string;
  timestamp: Date;
  originalError?: unknown;
};

// Errores comunes reutilizables
export type BaseRepositoryError = RepositoryError | UnexpectedError;
export type BaseRepositoryWithNotFoundError = RepositoryError | KahootNotFoundError | UnexpectedError;
export type BaseRepositoryWithValidationError = RepositoryError | InvalidKahootDataError | UnexpectedError;

// Tipos específicos para cada operación
export type GetKahootByIdError = 
  | RepositoryError
  | KahootNotFoundError
  | UnexpectedError;

export type UpdateKahootError = 
  | RepositoryError
  | KahootNotFoundError
  | InvalidKahootDataError
  | UnauthorizedError
  | UnexpectedError;

export type DeleteKahootError = 
  | RepositoryError
  | KahootNotFoundError
  | UnauthorizedError
  | UnexpectedError;

export type CreateKahootError = 
  | RepositoryError
  | InvalidKahootDataError
  | UnexpectedError;