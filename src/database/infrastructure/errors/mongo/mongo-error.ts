// src/database/infrastructure/errors/mongo/mongo-error.ts
import { RepositoryError } from '../repository-error';
import { RepositoryErrorSubCategory, RepositoryErrorSubCategoryHelpers } from '../repository-error-sub-category.enum';
import { RepositoryErrorContext } from '../repository-error-context.interface';

export class MongoError extends RepositoryError {
  private _errorCode?: number;
  private _writeErrors?: any[];
  private _writeConcernError?: any;

  constructor(
    message: string,
    subCategory: RepositoryErrorSubCategory,
    context: RepositoryErrorContext,
    originalError?: any
  ) {
    super(message, subCategory, context, 'mongodb', originalError);
    
    // Extraer información específica de MongoDB
    if (originalError) {
      this._errorCode = originalError.code;
      this._writeErrors = originalError.writeErrors;
      this._writeConcernError = originalError.writeConcernError;
    }
    
    Object.setPrototypeOf(this, MongoError.prototype);
  }

  // Getters de categoría (similar a PostgresError)
  get isNotFound(): boolean {
    return RepositoryErrorSubCategoryHelpers.isNotFound(this.subCategory);
  }
  
  get isDuplicateKey(): boolean {
    return RepositoryErrorSubCategoryHelpers.isDuplicateKey(this.subCategory);
  }
  
  get isConnectionError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isConnectionError(this.subCategory);
  }
  
  get isTimeout(): boolean {
    return RepositoryErrorSubCategoryHelpers.isTimeout(this.subCategory);
  }
  
  get isValidationError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isValidation(this.subCategory);
  }
  
  get isPermissionError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isPermission(this.subCategory);
  }
  
  get isRecoverable(): boolean {
    return RepositoryErrorSubCategoryHelpers.isRecoverable(this.subCategory);
  }
  
  get isClientError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isClientError(this.subCategory);
  }

  // MongoDB específico
  get mongoErrorCode(): number | undefined {
    return this._errorCode;
  }

  get isNetworkError(): boolean {
    return [
      6,    // HostUnreachable
      7,    // HostNotFound
      89,   // NetworkTimeout
      91,   // ShutdownInProgress
      11600 // InterruptedAtShutdown
    ].includes(this._errorCode || 0);
  }

  get isWriteConflict(): boolean {
    return this._errorCode === 112;
  }

  get isCursorNotFound(): boolean {
    return this._errorCode === 43;
  }

  get isNotPrimary(): boolean {
    return this._errorCode === 10107;
  }

  get isNodeIsRecovering(): boolean {
    return this._errorCode === 13436;
  }

  get writeErrors(): any[] | undefined {
    return this._writeErrors;
  }

  get writeConcernError(): any | undefined {
    return this._writeConcernError;
  }

  get operationType(): string | undefined {
    try {
      const details = this.context.details ? JSON.parse(this.context.details) : {};
      return details.operationType;
    } catch {
      return undefined;
    }
  }

  get affectedDocuments(): number {
    try {
      const details = this.context.details ? JSON.parse(this.context.details) : {};
      return details.affectedDocuments || 0;
    } catch {
      return 0;
    }
  }

  // Métodos de utilidad
  get duplicateKeys(): string[] {
    if (!this._writeErrors) return [];
    
    const keys: string[] = [];
    this._writeErrors.forEach(error => {
      if (error.code === 11000 && error.errmsg) {
        const match = error.errmsg.match(/index: (\w+)/);
        if (match) keys.push(match[1]);
      }
    });
    return keys;
  }

  suggestSolution(): string {
    if (this.isDuplicateKey) {
      const keys = this.duplicateKeys;
      return keys.length > 0 
        ? `Los siguientes índices tienen valores duplicados: ${keys.join(', ')}`
        : 'Valor duplicado encontrado. Use un valor único.';
    }
    if (this.isNetworkError) {
      return 'Verificar conexión de red y disponibilidad del servidor MongoDB';
    }
    if (this.isNotPrimary || this.isNodeIsRecovering) {
      return 'El nodo primario no está disponible. Intente reconectar o verifique el estado del cluster';
    }
    if (this.isWriteConflict) {
      return 'Conflicto de escritura. Intente la operación nuevamente';
    }
    return 'Consulte la documentación de MongoDB para más detalles';
  }
}