/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

//File: src\core\infrastructure\services\global-error-mapping.service.ts

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

  public toSocketResponse(errorData: ErrorData): IMappedSocketError {
    const [statusCode, message] = this.determineStatusCodeAndMessage(errorData);
    const errorName = this.getErrorNameByStatus(statusCode);
    const event = this.determineSocketEvent(errorData, statusCode);

    return {
      event,
      data: {
        statusCode,
        message,
        error: errorName,
        errorId: errorData.errorId,
      },
    };
  }

  private determineSocketEvent(error: ErrorData, statusCode: number): string {
    // Cast a number para evitar @typescript-eslint/no-unsafe-enum-comparison
    const status = statusCode;

    if (
      status === (HttpStatus.NOT_FOUND as number) &&
      (error.code.includes('SESSION') || error.code.includes('LOBBY'))
    ) {
      return ServerErrorEvents.UNAVAILABLE_SESSION;
    }

    if (
      status === (HttpStatus.CONFLICT as number) ||
      error.code === 'STATE_MISMATCH'
    ) {
      return ServerErrorEvents.SYNC_ERROR;
    }

    return ServerErrorEvents.FATAL_ERROR;
  }

  private getErrorNameByStatus(status: number): string {
    const map: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      500: 'Internal Server Error',
    };
    return map[status] ?? 'Error';
  }

  private sanitizeDetails(
    error: ErrorData,
    status: number,
  ): Record<string, unknown> | undefined {
    if (
      status >= 500 ||
      error.layer === ErrorLayer.INFRASTRUCTURE ||
      error.layer === ErrorLayer.EXTERNAL
    ) {
      return {
        info: 'A technical error has occurred. Contact support with your errorId.',
        timestamp: new Date().toISOString(),
      };
    }
    return error.details as Record<string, unknown> | undefined;
  }

  private determineStatusCodeAndMessage(
    error: ErrorData,
  ): [HttpStatus, string] {
    const { layer, code, details, message } = error;

    if (layer === ErrorLayer.DOMAIN) {
      const domainMap: Record<string, [HttpStatus, string]> = {
        RESOURCE_NOT_FOUND: [
          HttpStatus.NOT_FOUND,
          'The requested resource does not exist.',
        ],
        UNAUTHORIZED_ACCESS: [
          HttpStatus.FORBIDDEN,
          'You do not have permissions for this action.',
        ],
        VALIDATION_FAILED: [
          HttpStatus.BAD_REQUEST,
          'The provided data is invalid.',
        ],
        INVALID_NICKNAME: [
          HttpStatus.BAD_REQUEST,
          'The nickname provided is invalid.',
        ],
        CONFLICT: [HttpStatus.CONFLICT, 'Conflict in the resource state.'],
        INVALID_PARAMETER_LENGTH: [
          HttpStatus.BAD_REQUEST,
          'The parameter length is not valid.',
        ],
        INVALID_CREDENTIALS: [
          HttpStatus.UNAUTHORIZED,
          'Incorrect credentials.',
        ],
        ACCOUNT_BLOCKED: [
          HttpStatus.FORBIDDEN,
          'Your account has been blocked. Contact support.',
        ],
        ACCOUNT_INACTIVE: [
          HttpStatus.FORBIDDEN,
          'Your account has been deactivated. Contact support.',
        ],
      };

      return (
        domainMap[code] ?? [
          HttpStatus.BAD_REQUEST,
          message || 'Business rule violation.',
        ]
      );
    }

    if (layer === ErrorLayer.APPLICATION) {
      const detailsObj = details as Record<string, string> | undefined;
      const category = detailsObj?.errorCategory;

      if (code === 'Bad Request' || code === 'HTTP_ERROR_400') {
        return [HttpStatus.BAD_REQUEST, message];
      }

      const appMap: Record<string, [HttpStatus, string]> = {
        NOT_FOUND: [HttpStatus.NOT_FOUND, 'Resource not found.'],
        UNAUTHORIZED: [
          HttpStatus.UNAUTHORIZED,
          'Not authorized to perform this action.',
        ],
        FORBIDDEN: [
          HttpStatus.FORBIDDEN,
          'Access forbidden due to resource state or policies.',
        ],
        HTTP_ERROR_401: [
          HttpStatus.UNAUTHORIZED,
          'Invalid or missing authentication token.',
        ],
        HTTP_ERROR_403: [
          HttpStatus.FORBIDDEN,
          'You do not have permission to access this resource.',
        ],'400': [HttpStatus.BAD_REQUEST, message || 'Bad Request'],
        '401': [HttpStatus.UNAUTHORIZED, message || 'Unauthorized'],
        '403': [HttpStatus.FORBIDDEN, message || 'Forbidden'],
        '404': [HttpStatus.NOT_FOUND, message || 'NOT_FOUND'],
      };

      // Se usa 'in' para verificar la existencia en el objeto de forma segura para TS y ESLint
      const finalKey = category && category in appMap ? category : code;

      return (
        appMap[finalKey] ?? [
          HttpStatus.BAD_REQUEST,
          'Application orchestration error.',
        ]
      );
    }

    return [
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Infrastructure or external service error.',
    ];
  }
}
