// src/core/services/error-mapping.service.ts

import { Injectable, HttpStatus } from '@nestjs/common';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { IErrorResponse } from 'src/core/errors/interface/i-error-response.interface';



@Injectable()
export class ErrorMappingService {

  public toClientResponse(errorData: ErrorData): IErrorResponse {
    
    const [status, message] = this.determineStatusCodeAndMessage(errorData);

    return {
      status: status,
      code: errorData.code,
      message: message,
      details: errorData.details,
      errorId: errorData.errorId,
    };
  }

  private determineStatusCodeAndMessage(error: ErrorData): [HttpStatus, string] {
    
    // --- 1. Dominio (Business/Validation) ---
    if (error.layer === ErrorLayer.DOMAIN) {
      switch (error.code) {
        case 'RESOURCE_NOT_FOUND':
          return [HttpStatus.NOT_FOUND, 'El recurso solicitado no fue encontrado.'];
        case 'UNAUTHORIZED_ACCESS':
          return [HttpStatus.FORBIDDEN, 'No tienes permiso para realizar esta acción.'];
        case 'INVALID_DATA':
        case 'VALIDATION_FAILED':
          return [HttpStatus.BAD_REQUEST, 'Datos de entrada inválidos. Por favor, verifica tu solicitud.'];
        case 'PRECONDITION_FAILED': 
          return [HttpStatus.PRECONDITION_FAILED, 'La operación no es posible en el estado actual del recurso.'];
        case 'DUPLICATE_RESOURCE_CONSTRAINT':
        case 'CONFLICT':
        case 'STATE_CONFLICT':
          return [HttpStatus.CONFLICT, 'La acción no puede ser completada debido a un conflicto o duplicidad.'];
        default:
          return [HttpStatus.BAD_REQUEST, 'Fallo en la regla de negocio del dominio.'];
      }
    }

    // --- 2. Infraestructura/Externos (5xx/4xx) ---
    if (error.layer === ErrorLayer.INFRASTRUCTURE || error.layer === ErrorLayer.EXTERNAL) {
      switch (error.code) {
        case 'DB_CONNECTION_FAILED':
        case 'EXTERNAL_CONNECTION_FAILED':
        case 'EXTERNAL_SERVICE_UNAVAILABLE':
          return [HttpStatus.SERVICE_UNAVAILABLE, 'El servicio no está disponible temporalmente. Inténtalo de nuevo más tarde.'];
        case 'EXTERNAL_RESOURCE_EXHAUSTED':
          return [HttpStatus.TOO_MANY_REQUESTS, 'Límite de servicio excedido. Inténtalo de nuevo.'];
        case 'RESOURCE_NOT_FOUND_EXTERNAL':
          return [HttpStatus.NOT_FOUND, 'Recurso no encontrado en el proveedor de almacenamiento externo.'];
        default:
          return [HttpStatus.INTERNAL_SERVER_ERROR, 'Ocurrió un error técnico al procesar tu solicitud.'];
      }
    }

    // --- 3. Aplicación (Internal/5xx) ---
    if (error.layer === ErrorLayer.APPLICATION) {
      return [HttpStatus.INTERNAL_SERVER_ERROR, 'Ocurrió un error interno inesperado. Por favor, contacta a soporte.'];
    }

    // 4. Fallback Global
    return [HttpStatus.INTERNAL_SERVER_ERROR, 'Un error desconocido ha ocurrido.'];
  }
}