// src/shared/services/error-mapper.service.ts
import { Injectable } from '@nestjs/common';
import { 
  BadRequestException, 
  NotFoundException, 
  ForbiddenException, 
  InternalServerErrorException, 
  ServiceUnavailableException, 
  ConflictException,
  HttpException 
} from '@nestjs/common';
import { DatabaseError } from 'src/database/infrastructure/errors';
import { UnexpectedError } from 'src/kahoots/application/errors/kahoot-aplication.errors';
import { InvalidKahootDataError, KahootNotFoundError, UnauthorizedError } from 'src/kahoots/domain/errors/kahoot-domain.errors';

// Definimos un tipo auxiliar para DatabaseError
type DatabaseErrorType = DatabaseError & {
  type: string;
  message: string;
  timestamp: Date;
};

// Tipo general para cualquier error de aplicación
export type AppError = 
  | DatabaseErrorType
  | KahootNotFoundError
  | InvalidKahootDataError
  | UnauthorizedError
  | UnexpectedError;

@Injectable()
export class ErrorMapperService {
  
  /**
   * Convierte errores de aplicación en excepciones HTTP apropiadas
   */
  mapToHttpException(error: AppError | HttpException): HttpException {
    // Si ya es una excepción HTTP, devolverla directamente
    if (error instanceof HttpException) {
      return error;
    }

    const type = error.type || 'UnexpectedError';
    const message = error.message || 'Error desconocido';

    // Mapeo basado en el tipo de error
    switch (type) {
      // Not Found errors
      case 'KahootNotFound':
        return new NotFoundException(message);
      
      // Validation/Business errors
      case 'InvalidKahootData':
        return new BadRequestException(this.getFriendlyValidationMessage(error));
      
      // Authorization errors
      case 'Unauthorized':
        return new ForbiddenException(message);
      
      // Database errors
      case 'DatabaseDuplicateError':
        return new ConflictException(message || 'El recurso ya existe');
        
      case 'DatabaseConnectionError':
        return new ServiceUnavailableException(message || 'Servicio temporalmente no disponible');
        
      case 'DatabaseValidationError':
      case 'DatabaseQueryError':
        return new BadRequestException(message);
        
      case 'DatabaseNotFoundError':
        return new NotFoundException(message);
      
      // Unexpected/Internal errors
      case 'UnexpectedError':
        this.logInternalError(error as UnexpectedError);
        return new InternalServerErrorException('Error interno del servidor');
      
      // Default para cualquier error inesperado
      default:
        this.logUnknownError(error, type);
        return new InternalServerErrorException('Error interno del servidor');
    }
  }

  /**
   * Transforma mensajes técnicos en mensajes amigables para el usuario
   */
  private getFriendlyValidationMessage(error: AppError): string {
    // Mensajes específicos basados en el tipo de error
    if (error.type === 'InvalidKahootData') {
      return error.message || 'Datos del kahoot inválidos';
    }
    
    return error.message || 'Error de validación';
  }

  /**
   * Log interno para errores inesperados
   */
  private logInternalError(error: UnexpectedError): void {
    console.error('[Internal Error]:', {
      type: error.type,
      message: error.message,
      originalError: error.originalError,
      timestamp: error.timestamp || new Date(),
      stack: error.originalError instanceof Error ? error.originalError.stack : undefined
    });
  }

  /**
   * Log para errores de tipo desconocido
   */
  private logUnknownError(error: AppError, type: string): void {
    console.error(`[Unknown Error Type: ${type}]:`, {
      error,
      timestamp: new Date(),
    });
  }
}