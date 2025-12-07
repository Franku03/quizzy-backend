// src/kahoots/application/errors/kahoot-application-error.factory.ts
import { 
  CreateKahootError,
  UpdateKahootError,
  DeleteKahootError,
  GetKahootByIdError,
  CreateKahootValidationError,
  UpdateKahootValidationError,
  KahootApplicationError
} from './kahoot-aplication.errors';

export class KahootApplicationErrorFactory {
  // ========== MÉTODOS BÁSICOS DE CREACIÓN ==========
  
  static create(
    message: string,
    userId?: string,
    context?: Record<string, any>,
    originalError?: any
  ): CreateKahootError {
    return new CreateKahootError(message, userId, context, originalError);
  }

  static createValidation(
    message: string,
    validationDetails?: Record<string, string[]>,
    userId?: string,
    context?: Record<string, any>,
    originalError?: any
  ): CreateKahootValidationError {
    return new CreateKahootValidationError(
      message, 
      validationDetails, 
      userId, 
      context, 
      originalError
    );
  }

  static update(
    message: string,
    kahootId?: string,
    userId?: string,
    context?: Record<string, any>,
    originalError?: any
  ): UpdateKahootError {
    return new UpdateKahootError(
      message, 
      kahootId, 
      userId, 
      context, 
      originalError
    );
  }

  static updateValidation(
    message: string,
    validationDetails?: Record<string, string[]>,
    kahootId?: string,
    userId?: string,
    context?: Record<string, any>,
    originalError?: any
  ): UpdateKahootValidationError {
    return new UpdateKahootValidationError(
      message, 
      validationDetails, 
      kahootId, 
      userId, 
      context, 
      originalError
    );
  }

  static delete(
    message: string,
    kahootId?: string,
    userId?: string,
    context?: Record<string, any>,
    originalError?: any
  ): DeleteKahootError {
    return new DeleteKahootError(
      message, 
      kahootId, 
      userId, 
      context, 
      originalError
    );
  }

  static getById(
    message: string,
    kahootId?: string,
    context?: Record<string, any>,
    originalError?: any
  ): GetKahootByIdError {
    return new GetKahootByIdError(
      message, 
      kahootId, 
      context, 
      originalError
    );
  }

  // ========== MÉTODOS PARA CASOS COMUNES ==========
  
  static notFound(
    kahootId: string,
    operation: Exclude<'create' | 'update' | 'delete' | 'getById', 'create'>,
    context?: Record<string, any>
  ): KahootApplicationError {
    const message = `Kahoot con ID "${kahootId}" no encontrado`;
    
    switch (operation) {
      case 'getById':
        return this.getById(message, kahootId, {
          ...context,
          suggestedOperation: 'Verificar ID o crear nuevo',
          errorCategory: 'NOT_FOUND'
        });
        
      case 'update':
        return this.update(message, kahootId, undefined, {
          ...context,
          suggestedOperation: 'Verificar ID antes de actualizar',
          errorCategory: 'NOT_FOUND'
        });
        
      case 'delete':
        return this.delete(message, kahootId, undefined, {
          ...context,
          suggestedOperation: 'El recurso ya no existe',
          errorCategory: 'NOT_FOUND'
        });
        
      default:
        // Fallback para TypeScript
        const exhaustiveCheck: never = operation;
        return this.internal('getById', new Error(`Operación inválida: ${operation}`), {
          ...context,
          kahootId,
          invalidOperation: operation
        });
    }
  }

  static unauthorized(
    operation: 'create' | 'update' | 'delete' | 'getById',
    kahootId: string,
    userId: string,
    context?: Record<string, any>
  ): KahootApplicationError {
    const operationName = this.getOperationName(operation);
    const message = `Usuario no autorizado para ${operationName}`;
    
    switch (operation) {
      case 'create':
        return this.create(message, userId, {
          ...context,
          requiredPermission: 'AUTHENTICATED_USER',
          suggestedAction: 'Verificar credenciales o permisos',
          errorCategory: 'UNAUTHORIZED'
        });
        
      case 'update':
        return this.update(message, kahootId, userId, {
          ...context,
          requiredPermission: 'OWNER_OR_ADMIN',
          suggestedAction: 'Contactar al propietario del kahoot',
          errorCategory: 'UNAUTHORIZED'
        });
        
      case 'delete':
        return this.delete(message, kahootId, userId, {
          ...context,
          requiredPermission: 'OWNER',
          suggestedAction: 'Solo el creador puede eliminar este kahoot',
          errorCategory: 'UNAUTHORIZED'
        });
        
      case 'getById':
        return this.getById(message, kahootId, {
          ...context,
          userId,
          requiredPermission: 'VIEWER_OR_OWNER',
          suggestedAction: 'Solicitar acceso al propietario',
          errorCategory: 'UNAUTHORIZED'
        });
        
      default:
        const exhaustiveCheck: never = operation;
        return this.internal(operation, new Error(`Operación inválida: ${operation}`), {
          ...context,
          kahootId,
          userId
        });
    }
  }

  static validationFailed(
    operation: 'create' | 'update',
    validationDetails: Record<string, string[]>,
    userId?: string,
    kahootId?: string,
    context?: Record<string, any>
  ): KahootApplicationError {
    const operationName = operation === 'create' ? 'creación' : 'actualización';
    const message = `Validación falló en ${operationName}`;
    
    if (operation === 'create') {
      return this.createValidation(
        message, 
        validationDetails, 
        userId, 
        {
          ...context,
          suggestedAction: 'Corregir los campos inválidos marcados',
          errorCategory: 'VALIDATION',
          invalidFields: Object.keys(validationDetails)
        }
      );
    } else {
      return this.updateValidation(
        message, 
        validationDetails, 
        kahootId, 
        userId, 
        {
          ...context,
          suggestedAction: 'Revisar los valores ingresados',
          errorCategory: 'VALIDATION',
          invalidFields: Object.keys(validationDetails)
        }
      );
    }
  }

  static connectionError(
    operation: 'create' | 'update' | 'delete' | 'getById',
    service: 'database' | 'external_api' | 'cache' | 'storage',
    context?: {
      kahootId?: string;
      userId?: string;
      [key: string]: any;
    },
    originalError?: any
  ): KahootApplicationError {
    const serviceNames: Record<string, string> = {
      'database': 'base de datos',
      'external_api': 'servicio externo',
      'cache': 'sistema de caché',
      'storage': 'almacenamiento'
    };
    
    const serviceName = serviceNames[service] || service;
    const message = `Error de conexión con ${serviceName}`;
    
    const { kahootId, userId, ...extraContext } = context || {};
    
    // Determinar si es error transitorio
    const isTransient = this.isTransientError(originalError);
    
    const baseMetadata = {
      ...extraContext,
      service,
      serviceName,
      isTransient,
      errorCategory: 'CONNECTION',
      suggestedAction: isTransient 
        ? 'Intentar nuevamente en unos momentos'
        : 'Contactar al equipo técnico',
      originalErrorMessage: originalError?.message,
      originalErrorCode: originalError?.code,
      originalErrorSubCategory: originalError?.subCategory
    };
    
    switch (operation) {
      case 'create':
        return this.create(
          message,
          userId,
          baseMetadata,
          originalError
        );
        
      case 'update':
        return this.update(
          message,
          kahootId,
          userId,
          baseMetadata,
          originalError
        );
        
      case 'delete':
        return this.delete(
          message,
          kahootId,
          userId,
          baseMetadata,
          originalError
        );
        
      case 'getById':
        return this.getById(
          message,
          kahootId,
          { ...baseMetadata, userId },
          originalError
        );
        
      default:
        const exhaustiveCheck: never = operation;
        return this.internal(operation, originalError || new Error(message), {
          ...baseMetadata,
          kahootId,
          userId
        });
    }
  }

  static internal(
    operation: 'create' | 'update' | 'delete' | 'getById',
    originalError: any,
    context?: Record<string, any>
  ): KahootApplicationError {
    const message = `Error interno en operación: ${this.getOperationName(operation)}`;
    
    const { kahootId, userId, ...extraContext } = context || {};
    
    const baseMetadata = {
      ...extraContext,
      isInternalError: true,
      errorCategory: 'INTERNAL',
      originalErrorMessage: originalError?.message,
      originalErrorStack: originalError?.stack,
      originalErrorType: originalError?.type,
      timestamp: new Date().toISOString(),
      suggestedAction: 'Contactar al soporte técnico si el error persiste'
    };
    
    switch (operation) {
      case 'create':
        return this.create(
          message,
          userId,
          baseMetadata,
          originalError
        );
        
      case 'update':
        return this.update(
          message,
          kahootId,
          userId,
          baseMetadata,
          originalError
        );
        
      case 'delete':
        return this.delete(
          message,
          kahootId,
          userId,
          baseMetadata,
          originalError
        );
        
      case 'getById':
        return this.getById(
          message,
          kahootId,
          { ...baseMetadata, userId },
          originalError
        );
        
      default:
        const exhaustiveCheck: never = operation;
        // Fallback genérico
        return new CreateKahootError(
          `Error interno: ${operation}`,
          userId,
          { ...baseMetadata, operation, kahootId },
          originalError
        );
    }
  }

  static conflict(
    operation: 'create' | 'update',
    conflictType: 'duplicate' | 'version' | 'state',
    details: {
      field?: string;
      value?: any;
      currentValue?: any;
      expectedValue?: any;
      [key: string]: any;
    },
    userId?: string,
    kahootId?: string,
    context?: Record<string, any>
  ): KahootApplicationError {
    const conflictMessages: Record<string, string> = {
      'duplicate': 'Registro duplicado',
      'version': 'Conflicto de versión',
      'state': 'Estado inválido para la operación'
    };
    
    const message = conflictMessages[conflictType] || 'Conflicto detectado';
    
    const baseMetadata = {
      ...context,
      conflictType,
      ...details,
      errorCategory: 'CONFLICT',
      suggestedAction: conflictType === 'duplicate' 
        ? 'Verificar datos únicos o usar otro valor'
        : 'Actualizar y volver a intentar'
    };
    
    if (operation === 'create') {
      return this.create(
        message,
        userId,
        baseMetadata
      );
    } else {
      return this.update(
        message,
        kahootId,
        userId,
        baseMetadata
      );
    }
  }

  static rateLimit(
    operation: 'create' | 'update' | 'delete' | 'getById',
    limits: {
      max: number;
      window: string;
      remaining?: number;
      resetAt?: Date;
    },
    userId?: string,
    kahootId?: string,
    context?: Record<string, any>
  ): KahootApplicationError {
    const message = `Límite de tasa excedido`;
    
    const baseMetadata = {
      ...context,
      rateLimit: limits,
      errorCategory: 'RATE_LIMIT',
      suggestedAction: `Esperar ${limits.window} antes de intentar nuevamente`,
      retryAfter: limits.resetAt
        ? Math.ceil((limits.resetAt.getTime() - Date.now()) / 1000)
        : undefined
    };
    
    switch (operation) {
      case 'create':
        return this.create(message, userId, baseMetadata);
        
      case 'update':
        return this.update(message, kahootId, userId, baseMetadata);
        
      case 'delete':
        return this.delete(message, kahootId, userId, baseMetadata);
        
      case 'getById':
        return this.getById(message, kahootId, { ...baseMetadata, userId });
        
      default:
        return this.internal(operation, new Error(message), {
          ...baseMetadata,
          userId,
          kahootId
        });
    }
  }

  // ========== MÉTODOS UTILITARIOS ==========
  
  private static getOperationName(operation: string): string {
    const names: Record<string, string> = {
      'create': 'crear',
      'update': 'actualizar', 
      'delete': 'eliminar',
      'getById': 'consultar'
    };
    
    return names[operation] || operation;
  }

  private static isTransientError(error: any): boolean {
    if (!error) return false;
    
    // Errores de red/tiempo de espera
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND') {
      return true;
    }
    
    // Subcategorías transitorias
    if (error.subCategory === 'CONNECTION' ||
        error.subCategory === 'TIMEOUT' ||
        error.subCategory === 'LOCK' ||
        error.subCategory === 'RESOURCE_EXHAUSTED') {
      return true;
    }
    
    // Errores de tasa (rate limiting)
    if (error.status === 429 || error.code === 429) {
      return true;
    }
    
    // Servidor ocupado
    if (error.status === 503 || error.code === 503) {
      return true;
    }
    
    return false;
  }

  // ========== MÉTODOS DE DETECCIÓN ==========
  
  static isValidationError(error: KahootApplicationError): boolean {
    return error instanceof CreateKahootValidationError || 
           error instanceof UpdateKahootValidationError;
  }

  static isNotFoundError(error: KahootApplicationError): boolean {
    return (error instanceof GetKahootByIdError || 
            error instanceof UpdateKahootError || 
            error instanceof DeleteKahootError) &&
           error.message.includes('no encontrado');
  }

  static isUnauthorizedError(error: KahootApplicationError): boolean {
    return error.message.includes('no autorizado') ||
           (error.metadata?.errorCategory === 'UNAUTHORIZED');
  }

  static isConnectionError(error: KahootApplicationError): boolean {
    return error.metadata?.errorCategory === 'CONNECTION' ||
           error.message.includes('conexión') ||
           error.message.includes('conexion');
  }

  static isInternalError(error: KahootApplicationError): boolean {
    return error.metadata?.isInternalError === true ||
           error.metadata?.errorCategory === 'INTERNAL';
  }

  static isConflictError(error: KahootApplicationError): boolean {
    return error.metadata?.errorCategory === 'CONFLICT' ||
           error.message.includes('duplicado') ||
           error.message.includes('conflicto');
  }

  static isRateLimitError(error: KahootApplicationError): boolean {
    return error.metadata?.errorCategory === 'RATE_LIMIT' ||
           error.message.includes('Límite de tasa') ||
           error.message.includes('rate limit');
  }

  // ========== MÉTODOS DE UTILIDAD ==========
  
  static extractValidationDetails(error: KahootApplicationError): Record<string, string[]> {
    if (error instanceof CreateKahootValidationError) {
      return error.validationDetails || {};
    }
    
    if (error instanceof UpdateKahootValidationError) {
      return error.validationDetails || {};
    }
    
    return {};
  }

  static getSuggestedAction(error: KahootApplicationError): string {
    return error.metadata?.suggestedAction || 
           'Por favor, intente nuevamente o contacte soporte';
  }

  static shouldRetry(error: KahootApplicationError): boolean {
    return this.isConnectionError(error) || 
           (error.metadata?.isTransient === true) ||
           this.isRateLimitError(error);
  }

  static getRetryDelay(error: KahootApplicationError): number {
    if (this.isRateLimitError(error) && error.metadata?.retryAfter) {
      return error.metadata.retryAfter;
    }
    
    // Delay base para errores transitorios
    if (this.shouldRetry(error)) {
      return 5000; // 5 segundos
    }
    
    return 0;
  }
}