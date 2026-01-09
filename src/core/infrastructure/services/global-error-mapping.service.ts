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
      //==========================
      // REGLA: Filtrado de metadatos sensibles para el cliente final
      //==========================
      details: this.sanitizeDetails(errorData, status),
    };
  }

  private sanitizeDetails(error: ErrorData, status: number): any {
    //==========================
    // REGLA: Si es un error de servidor (500) o de capas tecnicas, ocultamos los detalles
    //==========================
    if (
      status >= 500 ||
      error.layer === ErrorLayer.INFRASTRUCTURE ||
      error.layer === ErrorLayer.EXTERNAL
    ) {
      return {
        info: 'A technical error has occurred. Contact support with your errorId.',
        timestamp: new Date().toISOString()
      };
    }
    return error.details;
  }

  private determineStatusCodeAndMessage(error: ErrorData): [HttpStatus, string] {
    const { layer, code, details, message } = error;

    // //==========================
    // // 1. DOMAIN: Errores de logica de negocio y Agregados
    // //==========================
    if (layer === ErrorLayer.DOMAIN) {
      const domainMap: Record<string, [HttpStatus, string]> = {
        'RESOURCE_NOT_FOUND': [HttpStatus.NOT_FOUND, 'The requested resource does not exist.'],
        'UNAUTHORIZED_ACCESS': [HttpStatus.FORBIDDEN, 'You do not have permissions for this action.'],
        'VALIDATION_FAILED': [HttpStatus.BAD_REQUEST, 'The provided data is invalid.'],
        'CONFLICT': [HttpStatus.CONFLICT, 'Conflict in the resource state.'],
        'INVALID_PARAMETER_LENGTH': [HttpStatus.BAD_REQUEST, 'La longitud del parámetro no es válida.'],
      };
      return domainMap[code] ?? [HttpStatus.BAD_REQUEST, 'Business rule violation.'];
    }

    //==========================
    // 2. APPLICATION: Orquestacion y Autorizacion
    //==========================
    if (layer === ErrorLayer.APPLICATION) {
      // //==========================
      // // REGLA: Usamos la CATEGORY inyectada por la AppErrorFactory para mapear el HTTP status
      // //==========================
      const category = details?.errorCategory;

      if (code === 'Bad Request' || code === 'HTTP_ERROR_400') {
            return [HttpStatus.BAD_REQUEST, message]; 
        }

      const appMap: Record<string, [HttpStatus, string]> = {
        'NOT_FOUND': [HttpStatus.NOT_FOUND, 'Resource not found.'],
        'UNAUTHORIZED': [HttpStatus.UNAUTHORIZED, 'Not authorized to perform this action.'],
        'FORBIDDEN': [HttpStatus.FORBIDDEN, 'Access forbidden due to resource state or policies.'],
        'HTTP_ERROR_401': [HttpStatus.UNAUTHORIZED, 'Invalid or missing authentication token.'],
        'HTTP_ERROR_403': [HttpStatus.FORBIDDEN, 'You do not have permission to access this resource.'],
      };

      


      //Intentar categoría, si no, intentar código, si no, fallback.
      return appMap[category] ?? appMap[code] ?? [HttpStatus.BAD_REQUEST, 'Application orchestration error.'];
    }

    //==========================
    // 3. INFRASTRUCTURE / EXTERNAL
    //==========================
    if (layer === ErrorLayer.INFRASTRUCTURE || layer === ErrorLayer.EXTERNAL) {
      return [HttpStatus.INTERNAL_SERVER_ERROR, 'Infrastructure or external service error.'];
    }

    return [HttpStatus.INTERNAL_SERVER_ERROR, 'Unexpected system error.'];
  }
}