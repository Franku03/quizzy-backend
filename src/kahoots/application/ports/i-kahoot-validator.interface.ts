// src/kahoots/application/ports/kahoot-validator.interface.ts
import { Either, ErrorData } from 'src/core/types';

export interface IKahootValidator<T> {
  validateAccess(
    kahootId: string,
    userId: string,
    operation: 'read' | 'update' | 'delete'
  ): Promise<Either<ErrorData, T>>;
}