// src/kahoots/domain/errors/kahoot-domain.errors.ts
import { DomainError } from "src/core/errors/domain/domain-error";

export class KahootNotFoundError extends DomainError {
  constructor(kahootId: string) {
    super('KahootNotFound', `Kahoot ${kahootId} no encontrado`, { kahootId });
    Object.setPrototypeOf(this, KahootNotFoundError.prototype);
  }
}

export class InvalidKahootDataError extends DomainError {
  constructor(message: string, validationDetails?: Record<string, string[]>) {
    super('InvalidKahootData', message, { validationDetails });
    Object.setPrototypeOf(this, InvalidKahootDataError.prototype);
  }
}

export class UnauthorizedKahootError extends DomainError {
  constructor(userId: string, kahootId: string, action: string) {
    super('UnauthorizedKahoot', `Usuario ${userId} no autorizado para ${action}`, { 
      userId, kahootId, action 
    });
    Object.setPrototypeOf(this, UnauthorizedKahootError.prototype);
  }
}