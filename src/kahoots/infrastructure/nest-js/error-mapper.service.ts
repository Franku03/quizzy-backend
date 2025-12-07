// src/shared/services/error-mapper.service.ts
import { 
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  PayloadTooLargeException,
  InternalServerErrorException,
  ServiceUnavailableException,
  GatewayTimeoutException,
  UnprocessableEntityException,
  NotImplementedException,
  BadGatewayException,
} from '@nestjs/common';
import { BaseError } from 'src/core/errors/base/base-error';
import { ErrorCategory } from 'src/core/errors/base/base-error.category.enum';

@Injectable()
export class ErrorMapperService {
  
  // ========== MÉTODO PRINCIPAL ==========
  mapToHttpException(error: any): HttpException {
    // Si ya es HttpException, devolverlo directamente
    if (error instanceof HttpException) {
      return error;
    }

    // Extraer propiedades
    const errorProps = this.extractErrorProperties(error);
    
    // Determinar qué excepción crear
    return this.createAppropriateException(errorProps);
  }

  // ========== EXTRACCIÓN DE PROPIEDADES ==========
  private extractErrorProperties(error: any): {
    type: string;
    message: string;
    category: string;
    metadata?: Record<string, any>;
    timestamp: Date;
  } {
    // Si es BaseError o similar
    if (error instanceof BaseError) {
      return {
        type: error.type,
        message: error.message,
        category: error.category,
        metadata: error.metadata,
        timestamp: error.timestamp,
      };
    }

    // Si es Error nativo
    if (error instanceof Error) {
      return {
        type: error.name,
        message: error.message,
        category: ErrorCategory.APPLICATION,
        timestamp: new Date(),
      };
    }

    // Si es objeto plano
    if (error && typeof error === 'object') {
      return {
        type: error.type || error.name || error.code || 'UnknownError',
        message: error.message || 'Error desconocido',
        category: error.category || this.inferCategoryFromType(error.type || error.name),
        metadata: error.metadata || error.details || error.context,
        timestamp: error.timestamp || new Date(),
      };
    }

    // Si es string
    if (typeof error === 'string') {
      return {
        type: 'GenericError',
        message: error,
        category: ErrorCategory.APPLICATION,
        timestamp: new Date(),
      };
    }

    // Fallback
    return {
      type: 'UnknownError',
      message: 'Error interno del servidor',
      category: ErrorCategory.APPLICATION,
      timestamp: new Date(),
    };
  }

  // ========== CREAR EXCEPCIONES APROPIADAS ==========
  private createAppropriateException(errorProps: {
    type: string;
    message: string;
    category: string;
    metadata?: Record<string, any>;
    timestamp: Date;
  }): HttpException {
    const { type, message, metadata } = errorProps;
    const typeLower = type.toLowerCase();

    // Mapeo específico por tipo
    if (typeLower.includes('notfound') || 
        typeLower.includes('noencontrado')) {
      return new NotFoundException(this.buildResponse(message, metadata));
    }

    if (typeLower.includes('unauthorized') || 
        typeLower.includes('authentication')) {
      return new UnauthorizedException(this.buildResponse(message, metadata));
    }

    if (typeLower.includes('forbidden') || 
        typeLower.includes('nopermission')) {
      return new ForbiddenException(this.buildResponse(message, metadata));
    }

    if (typeLower.includes('validation') || 
        typeLower.includes('invalid') ||
        typeLower.includes('badrequest')) {
      return new BadRequestException(this.buildResponse(message, metadata));
    }

    if (typeLower.includes('conflict') || 
        typeLower.includes('duplicate') ||
        typeLower.includes('alreadyexists')) {
      return new ConflictException(this.buildResponse(message, metadata));
    }

    if (typeLower.includes('payloadtoolarge') ||
        typeLower.includes('filesizetoolarge')) {
      return new PayloadTooLargeException(this.buildResponse(message, metadata));
    }

    if (typeLower.includes('ratelimit') || 
        typeLower.includes('toomanyrequests')) {
      // Usar HttpException directamente con status 429
      return new HttpException(
        this.buildResponse(message, metadata),
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    if (typeLower.includes('gatewaytimeout') ||
        typeLower.includes('timeout')) {
      return new GatewayTimeoutException(this.buildResponse(message, metadata));
    }

    if (typeLower.includes('serviceunavailable') ||
        typeLower.includes('maintenance')) {
      return new ServiceUnavailableException(this.buildResponse(message, metadata));
    }

    if (typeLower.includes('badgateway') ||
        typeLower.includes('proxyerror')) {
      return new BadGatewayException(this.buildResponse(message, metadata));
    }

    if (typeLower.includes('notimplemented')) {
      return new NotImplementedException(this.buildResponse(message, metadata));
    }

    if (typeLower.includes('unprocessableentity') ||
        typeLower.includes('invalidstate')) {
      return new UnprocessableEntityException(this.buildResponse(message, metadata));
    }

    // Mapeo por categoría (fallback)
    switch (errorProps.category) {
      case ErrorCategory.DOMAIN:
        return new UnprocessableEntityException(this.buildResponse(message, metadata));
      
      case ErrorCategory.APPLICATION:
        return new BadRequestException(this.buildResponse(message, metadata));
      
      case ErrorCategory.INFRASTRUCTURE:
        // Verificar si es transitorio
        const isTransient = this.isTransientError(errorProps);
        if (isTransient) {
          return new ServiceUnavailableException(this.buildResponse(message, metadata));
        }
        return new InternalServerErrorException(this.buildResponse(message, metadata));
      
      default:
        return new InternalServerErrorException(this.buildResponse(message, metadata));
    }
  }

  // ========== DETECTAR ERRORES TRANSITORIOS ==========
  private isTransientError(errorProps: {
    type: string;
    metadata?: Record<string, any>;
  }): boolean {
    const { type, metadata } = errorProps;
    const typeLower = type.toLowerCase();

    // Por tipo
    if (typeLower.includes('timeout') ||
        typeLower.includes('connection') ||
        typeLower.includes('network') ||
        typeLower.includes('serviceunavailable')) {
      return true;
    }

    // Por metadata
    if (metadata?.isTransient === true ||
        metadata?.retryable === true ||
        metadata?.subCategory === 'CONNECTION' ||
        metadata?.subCategory === 'TIMEOUT') {
      return true;
    }

    return false;
  }

  // ========== CONSTRUIR RESPUESTA ==========
  private buildResponse(message: string, metadata?: Record<string, any>): any {
    const response: any = {
      message,
      timestamp: new Date().toISOString(),
    };

    // Agregar metadata si existe y no está vacío
    if (metadata && Object.keys(metadata).length > 0) {
      response.details = metadata;
    }

    return response;
  }

  // ========== INFERIR CATEGORÍA ==========
  private inferCategoryFromType(type: string): ErrorCategory {
    if (!type) return ErrorCategory.APPLICATION;

    const typeLower = type.toLowerCase();
    
    if (typeLower.includes('domain') || 
        typeLower.includes('notfound') || 
        typeLower.includes('unauthorized') ||
        typeLower.includes('forbidden') ||
        typeLower.includes('conflict')) {
      return ErrorCategory.DOMAIN;
    }
    
    if (typeLower.includes('infrastructure') || 
        typeLower.includes('repository') || 
        typeLower.includes('database') ||
        typeLower.includes('network')) {
      return ErrorCategory.INFRASTRUCTURE;
    }
    
    return ErrorCategory.APPLICATION;
  }

  // ========== MÉTODOS DE CONVENIENCIA ==========
  mapToHttpResponse(error: any): { status: number; body: any } {
    const httpException = this.mapToHttpException(error);
    const response = httpException.getResponse();
    const status = httpException.getStatus();

    return {
      status,
      body: response,
    };
  }

  extractErrorDetails(error: any): {
    type: string;
    message: string;
    category: string;
    timestamp: string;
  } {
    const props = this.extractErrorProperties(error);
    return {
      type: props.type,
      message: props.message,
      category: props.category,
      timestamp: props.timestamp.toISOString(),
    };
  }

  shouldRetry(error: any): boolean {
    const props = this.extractErrorProperties(error);
    return this.isTransientError(props);
  }

  getRetryDelay(error: any): number {
    if (!this.shouldRetry(error)) return 0;

    const props = this.extractErrorProperties(error);
    
    // Rate limit: esperar 1 minuto
    if (props.type.toLowerCase().includes('ratelimit')) {
      return 60000;
    }
    
    // Timeout: esperar 5 segundos
    if (props.type.toLowerCase().includes('timeout')) {
      return 5000;
    }
    
    // Otros transitorios: 3 segundos
    return 3000;
  }
}