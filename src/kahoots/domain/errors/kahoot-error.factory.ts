// src/kahoots/domain/errors/kahoot-error.factory.ts
import { 
  KahootNotFoundError, 
  UnauthorizedKahootError,
  InvalidKahootDataError 
} from './kahoot-domain.errors';

export class KahootErrorFactory {
  /**
   * USAR: En handlers cuando no encuentras un kahoot
   */
  static notFound(kahootId: string): KahootNotFoundError {
    return new KahootNotFoundError(kahootId);
  }

  /**
   * USAR: En handlers cuando un usuario no es el owner
   */
  static unauthorized(
    userId: string, 
    kahootId: string, 
    action: string
  ): UnauthorizedKahootError {
    return new UnauthorizedKahootError(userId, kahootId, action);
  }

  /**
   * USAR: En validaciones de dominio
   */
  static invalidData(
    message: string, 
    validationDetails?: Record<string, string[]>
  ): InvalidKahootDataError {
    return new InvalidKahootDataError(message, validationDetails);
  }
}