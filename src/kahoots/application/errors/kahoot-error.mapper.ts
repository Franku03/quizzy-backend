// src/kahoots/application/errors/mappers/kahoot-error.mapper.ts
import { KahootApplicationErrorFactory } from './kahoot-application.error.factory';
import { 
  KahootNotFoundError, 
  InvalidKahootDataError, 
  UnauthorizedKahootError 
} from '../../domain/errors/kahoot-domain.errors';
import { KahootApplicationError } from './kahoot-aplication.errors';
import { RepositoryErrorSubCategory, RepositoryErrorSubCategoryHelpers } from 'src/database/infrastructure/errors/repository-error-sub-category.enum';

export class KahootErrorMapper {
  /**
   * Convierte un error de dominio a un error de aplicación
   */
  static fromDomain(
    domainError: any,
    operation: 'create' | 'update' | 'delete' | 'getById',
    context: { 
      kahootId?: string; 
      userId?: string; 
      commandData?: any;
      [key: string]: any;
    }
  ): KahootApplicationError {
    const { kahootId, userId, commandData, ...extraContext } = context;
    
    // Mapear KahootNotFoundError
    if (domainError instanceof KahootNotFoundError) {
      const targetKahootId = domainError.metadata?.kahootId || kahootId;
      
      if (!targetKahootId) {
        return KahootApplicationErrorFactory.internal(
          operation,
          domainError,
          { ...context, missingKahootId: true }
        );
      }
      
      // Solo operaciones donde tiene sentido "no encontrado"
      if (operation === 'create') {
        // En creación, si llega un NotFound es un error interno
        return KahootApplicationErrorFactory.internal(
          operation,
          domainError,
          {
            ...context,
            errorType: 'KahootNotFoundErrorInCreate',
            message: 'Error inesperado: NotFound en operación de creación'
          }
        );
      }
      
      return KahootApplicationErrorFactory.notFound(
        targetKahootId,
        operation,
        {
          ...extraContext,
          originalError: domainError,
          errorType: 'KahootNotFoundError'
        }
      );
    }
    
    // ... resto del fromDomain igual ...
    
    // Error de dominio no reconocido
    return KahootApplicationErrorFactory.internal(
      operation,
      domainError,
      {
        ...context,
        errorType: domainError.type || 'UnknownDomainError',
        domainErrorClass: domainError.constructor.name
      }
    );
  }
  
  /**
   * Convierte un error de infraestructura a un error de aplicación
   */
  static fromInfrastructure(
    infraError: any,
    operation: 'create' | 'update' | 'delete' | 'getById',
    context: {
      kahootId?: string;
      userId?: string;
      [key: string]: any;
    }
  ): KahootApplicationError {
    const { kahootId, userId, ...extraContext } = context;
    
    // Verificar si es error de repositorio (database)
    if (infraError.driver && infraError.subCategory) {
      const subCategory = infraError.subCategory as RepositoryErrorSubCategory;
      
      // ERRORES DE CONEXIÓN Y RED
      if (RepositoryErrorSubCategoryHelpers.isConnectionError(subCategory) ||
          RepositoryErrorSubCategoryHelpers.isTimeout(subCategory) ||
          RepositoryErrorSubCategoryHelpers.isResourceExhausted(subCategory)) {
        
        return KahootApplicationErrorFactory.connectionError(
          operation,
          'database',
          {
            kahootId,
            userId,
            ...extraContext,
            subCategory,
            driver: infraError.driver,
            originalContext: infraError.context
          },
          infraError
        );
      }
      
      // NOT FOUND
      if (RepositoryErrorSubCategoryHelpers.isNotFound(subCategory)) {
        const targetKahootId = infraError.context?.kahootId || kahootId;
        
        if (targetKahootId && operation !== 'create') {
          return KahootApplicationErrorFactory.notFound(
            targetKahootId,
            operation,
            {
              ...extraContext,
              originalError: infraError,
              errorType: 'RepositoryError',
              subCategory,
              driver: infraError.driver
            }
          );
        }
      }
      
      // DUPLICATE KEY (para creación principalmente)
      if (RepositoryErrorSubCategoryHelpers.isDuplicateKey(subCategory)) {
        const message = infraError.message || 'Registro duplicado';
        
        if (operation === 'create') {
          return KahootApplicationErrorFactory.create(
            message,
            userId,
            {
              ...extraContext,
              originalError: infraError,
              errorType: 'RepositoryError',
              subCategory,
              driver: infraError.driver,
              suggestedAction: 'Verificar datos únicos (título, slug, etc.)'
            },
            infraError
          );
        } else {
          // Update con duplicado (raro pero posible)
          return KahootApplicationErrorFactory.update(
            message,
            kahootId,
            userId,
            {
              ...extraContext,
              originalError: infraError,
              errorType: 'RepositoryError',
              subCategory,
              driver: infraError.driver,
              suggestedAction: 'El nuevo valor ya existe en otro registro'
            },
            infraError
          );
        }
      }
      
      // VALIDATION ERROR
      if (RepositoryErrorSubCategoryHelpers.isValidation(subCategory)) {
        const message = infraError.message || 'Error de validación en base de datos';
        
        return KahootApplicationErrorFactory.validationFailed(
          operation === 'create' ? 'create' : 'update',
          infraError.context?.validationDetails || {},
          userId,
          kahootId,
          {
            ...extraContext,
            originalError: infraError,
            errorType: 'RepositoryError',
            subCategory,
            driver: infraError.driver,
            isDatabaseValidation: true
          }
        );
      }
      
      // PERMISSION ERROR
      if (RepositoryErrorSubCategoryHelpers.isPermission(subCategory)) {
        return KahootApplicationErrorFactory.unauthorized(
          operation,
          kahootId || 'unknown',
          userId || 'unknown',
          {
            ...extraContext,
            originalError: infraError,
            errorType: 'RepositoryError',
            subCategory,
            driver: infraError.driver,
            databasePermissionError: true
          }
        );
      }
      
      // LOCK ERROR (deadlock, etc.)
      if (RepositoryErrorSubCategoryHelpers.isLock(subCategory)) {
        return KahootApplicationErrorFactory.internal(
          operation,
          infraError,
          {
            ...context,
            errorType: 'RepositoryError',
            subCategory,
            isConcurrencyError: true,
            driver: infraError.driver,
            suggestedAction: 'Intentar nuevamente'
          }
        );
      }
      
      // TRANSACTION ERROR
      if (RepositoryErrorSubCategoryHelpers.isTransaction(subCategory)) {
        return KahootApplicationErrorFactory.internal(
          operation,
          infraError,
          {
            ...context,
            errorType: 'RepositoryError',
            subCategory,
            isTransactionError: true,
            driver: infraError.driver,
            suggestedAction: 'La operación fue revertida, intentar nuevamente'
          }
        );
      }
      
      // QUERY SYNTAX (error del desarrollador)
      if (RepositoryErrorSubCategoryHelpers.isQuerySyntax(subCategory)) {
        return KahootApplicationErrorFactory.internal(
          operation,
          infraError,
          {
            ...context,
            errorType: 'RepositoryError',
            subCategory,
            isDeveloperError: true,
            driver: infraError.driver,
            suggestedAction: 'Reportar al equipo de desarrollo'
          }
        );
      }
      
      // CONFIGURATION ERROR
      if (RepositoryErrorSubCategoryHelpers.isConfiguration(subCategory)) {
        return KahootApplicationErrorFactory.internal(
          operation,
          infraError,
          {
            ...context,
            errorType: 'RepositoryError',
            subCategory,
            isConfigurationError: true,
            driver: infraError.driver,
            suggestedAction: 'Contactar al administrador del sistema'
          }
        );
      }
    }
    
    // Error de infraestructura genérico (no es RepositoryError)
    return KahootApplicationErrorFactory.internal(
      operation,
      infraError,
      {
        ...context,
        errorType: infraError.type || 'InfrastructureError',
        infraErrorClass: infraError.constructor?.name
      }
    );
  }
  
  /**
   * Convierte cualquier error a error de aplicación
   */
  static fromAny(
    error: any,
    operation: 'create' | 'update' | 'delete' | 'getById',
    context: {
      kahootId?: string;
      userId?: string;
      [key: string]: any;
    }
  ): KahootApplicationError {
    // Intentar identificar tipo de error
    if (error instanceof KahootNotFoundError || 
        error instanceof InvalidKahootDataError || 
        error instanceof UnauthorizedKahootError) {
      return this.fromDomain(error, operation, context);
    }
    
    // Verificar si es error de aplicación (ya está mapeado)
    if (error.type?.includes('Kahoot') && error.type?.includes('Error')) {
      return error;
    }
    
    // Verificar si es error de infraestructura
    if (error.driver || error.subCategory || error.type?.includes('Repository')) {
      return this.fromInfrastructure(error, operation, context);
    }
    
    // Verificar errores de red/Node.js comunes
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return KahootApplicationErrorFactory.connectionError(
        operation,
        'database', // o 'external_api' según el contexto
        context,
        error
      );
    }
    
    // Error desconocido
    return KahootApplicationErrorFactory.internal(
      operation,
      error,
      {
        ...context,
        errorType: 'UnknownError',
        errorClass: error.constructor?.name,
        errorCode: error.code
      }
    );
  }
  
  // ========== MÉTODOS UTILITARIOS PRIVADOS ==========
  
  private static mapActionToOperation(
    domainAction: string, 
    defaultOperation: string
  ): 'create' | 'update' | 'delete' | 'getById' {
    const actionMap: Record<string, 'create' | 'update' | 'delete' | 'getById'> = {
      'create': 'create',
      'update': 'update',
      'edit': 'update',
      'delete': 'delete',
      'remove': 'delete',
      'view': 'getById',
      'read': 'getById',
      'get': 'getById',
      'find': 'getById'
    };
    
    return actionMap[domainAction.toLowerCase()] || 
           (defaultOperation as 'create' | 'update' | 'delete' | 'getById');
  }
}