/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src/core/infrastructure/services/global-error-mapping.service.ts

import { Injectable, HttpStatus } from '@nestjs/common';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { IErrorResponse } from 'src/core/errors/interface/i-error-response.interface';
import { IMappedSocketError } from 'src/core/errors/interface/i-error-socket.interface'; 
import { ServerErrorEvents } from 'src/multiplayer-sessions/infrastructure/nest-js/enums/websocket.events.enum';

@Injectable()
export class ErrorMappingService {

  public toClientResponse(errorData: ErrorData): IErrorResponse {
    const [status, message] = this.determineStatusCodeAndMessage(errorData);

    return {
      status,
      code: errorData.code,
      message,
      errorId: errorData.errorId,
      details: this.sanitizeDetails(errorData, status),
    };
  }

  /**
   * CAMBIO AQUÍ: El tipo de retorno ahora es IMappedSocketError
   */
  public toSocketResponse(errorData: ErrorData): IMappedSocketError {
    
    const [statusCode, message] = this.determineStatusCodeAndMessage(errorData);
    const errorName = this.getErrorNameByStatus(statusCode);
    const event = this.determineSocketEvent(errorData, statusCode);

    // Ahora esto coincide con la interfaz IMappedSocketError
    return {
      event: event,
      data: {
        statusCode: statusCode,
        message: message,
        error: errorName,
        errorId: errorData.errorId
      }
    };
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  private determineSocketEvent(error: ErrorData, statusCode: number): string {
    if (statusCode === HttpStatus.NOT_FOUND && 
       (error.code.includes('SESSION') || error.code.includes('LOBBY'))) {
      return ServerErrorEvents.UNAVAILABLE_SESSION;
    }

    if (statusCode === HttpStatus.CONFLICT || error.code === 'STATE_MISMATCH') {
      return ServerErrorEvents.SYNC_ERROR;
    }

    return ServerErrorEvents.FATAL_ERROR;
  }

  private getErrorNameByStatus(status: number): string {
    switch (status) {
      case 400: return 'Bad Request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not Found';
      case 409: return 'Conflict';
      case 422: return 'Unprocessable Entity';
      case 500: return 'Internal Server Error';
      default: return 'Error';
    }
  }

  private sanitizeDetails(error: ErrorData, status: number): any {
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

    if (layer === ErrorLayer.DOMAIN) {
      const domainMap: Record<string, [HttpStatus, string]> = {
        'RESOURCE_NOT_FOUND': [HttpStatus.NOT_FOUND, 'The requested resource does not exist.'],
        'UNAUTHORIZED_ACCESS': [HttpStatus.FORBIDDEN, 'You do not have permissions for this action.'],
        'VALIDATION_FAILED': [HttpStatus.BAD_REQUEST, 'The provided data is invalid.'],
        'INVALID_NICKNAME': [HttpStatus.BAD_REQUEST, 'The nickname provided is invalid.'], 
        'CONFLICT': [HttpStatus.CONFLICT, 'Conflict in the resource state.'],
        'INVALID_PARAMETER_LENGTH': [HttpStatus.BAD_REQUEST, 'The parameter length is not valid.'],
        'INVALID_CREDENTIALS': [HttpStatus.UNAUTHORIZED, 'Incorrect credentials.'],
        'ACCOUNT_BLOCKED': [HttpStatus.FORBIDDEN, 'Your account has been blocked. Contact support.'],
        'ACCOUNT_INACTIVE': [HttpStatus.FORBIDDEN, 'Your account has been deactivated. Contact support.'],
      };
      
      return domainMap[code] ?? [HttpStatus.BAD_REQUEST, message || 'Business rule violation.'];
    }

    if (layer === ErrorLayer.APPLICATION) {
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

      return appMap[category] ?? appMap[code] ?? [HttpStatus.BAD_REQUEST, 'Application orchestration error.'];
    }

    if (layer === ErrorLayer.INFRASTRUCTURE || layer === ErrorLayer.EXTERNAL) {
      return [HttpStatus.INTERNAL_SERVER_ERROR, 'Infrastructure or external service error.'];
    }

    return [HttpStatus.INTERNAL_SERVER_ERROR, 'Unexpected system error.'];
  }
}