// src/core/services/error-mapping.service.ts
import { Injectable, HttpStatus } from '@nestjs/common';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { IErrorResponse } from 'src/core/errors/interface/i-error-response.interface';

@Injectable()
export class ErrorMappingService {
  public toClientResponse(errorData: ErrorData): IErrorResponse {
    const [status, message] = this.determineStatusCodeAndMessage(errorData);

    return {
      status,
      code: errorData.code,
      message,
      errorId: errorData.errorId,
      // God Tier: Filtramos detalles técnicos para el cliente
      details: this.sanitizeDetails(errorData, status),
    };
  }

  private sanitizeDetails(error: ErrorData, status: number): any {
    // Si es error de servidor o capa técnica (Infra/Externo), ocultamos TODO
    if (
      status >= 500 || 
      error.layer === ErrorLayer.INFRASTRUCTURE || 
      error.layer === ErrorLayer.EXTERNAL
    ) {
      return { 
        info: 'Un error técnico ha ocurrido. Contacte a soporte con su errorId.',
        timestamp: new Date().toISOString()
      };
    }
    // En errores de Dominio/App (4xx), permitimos detalles (ej. validaciones)
    return error.details;
  }

  private determineStatusCodeAndMessage(error: ErrorData): [HttpStatus, string] {
    const { layer, code } = error;

    // --- 1. DOMINIO ---
    if (layer === ErrorLayer.DOMAIN) {
      const domainMap: Record<string, [HttpStatus, string]> = {
        'RESOURCE_NOT_FOUND': [HttpStatus.NOT_FOUND, 'El recurso solicitado no existe.'],
        'UNAUTHORIZED_ACCESS': [HttpStatus.FORBIDDEN, 'No tienes permisos para esta acción.'],
        'VALIDATION_FAILED': [HttpStatus.BAD_REQUEST, 'Los datos enviados son inválidos.'],
        'CONFLICT': [HttpStatus.CONFLICT, 'Ya existe un recurso con estos datos.'],
      };
      return domainMap[code] ?? [HttpStatus.BAD_REQUEST, 'Error en las reglas de negocio.'];
    }

    // --- 2. INFRAESTRUCTURA / EXTERNAL ---
    if (layer === ErrorLayer.INFRASTRUCTURE || layer === ErrorLayer.EXTERNAL) {
      return [HttpStatus.INTERNAL_SERVER_ERROR, 'Error de conexión con servicios internos.'];
    }

    // --- 3. APLICACIÓN ---
    if (layer === ErrorLayer.APPLICATION) {
      if (code === 'RESOURCE_NOT_FOUND') return [HttpStatus.NOT_FOUND, 'Recurso no encontrado.'];
    }

    return [HttpStatus.INTERNAL_SERVER_ERROR, 'Error inesperado del sistema.'];
  }
}