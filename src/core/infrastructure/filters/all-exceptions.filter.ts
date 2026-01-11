/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src/core/infrastructure/filters/all-exceptions.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
  Logger,
  ContextType,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

import { ErrorData, ErrorLayer } from 'src/core/types';
import { ErrorMappingService } from '../services/global-error-mapping.service';
import { IErrorResponse } from 'src/core/errors/interface/i-error-response.interface';
import { isErrorData } from 'src/core/errors/type-guards.ts/error-data.type.guard';
import { IErrorContext } from 'src/core/errors/interface/context/i-error-context.interface';

// NUEVO IMPORT IMPORTANTE
import { IMappedSocketError } from 'src/core/errors/interface/i-error-socket.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    @Inject(ErrorMappingService)
    private readonly errorMappingService: ErrorMappingService,
  ) {}

  /**
   * Método principal de captura de excepciones.
   * Orquesta el flujo: Contexto -> Normalización -> Log -> Mapping -> Respuesta.
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const type = host.getType();
    
    // 1. CAPTURA DE CONTEXTO
    const infraContext = this.getInfraContext(host, type);

    // 2. NORMALIZACIÓN
    const errorToProcess = this.resolveErrorData(exception, infraContext);

    // 3. LOGGING
    this.logger.error(errorToProcess.toLogString());

    // 4. MAPPING Y RESPUESTA (Separado por protocolo)
    if (type === 'http') {
      // Flujo HTTP: Usa IErrorResponse
      const clientResponse = this.errorMappingService.toClientResponse(errorToProcess);
      this.handleHttpResponse(host, clientResponse);

    } else if (type === 'ws') {
      // Flujo WS: Usa IMappedSocketError (Evento + Data)
      const socketResponse = this.errorMappingService.toSocketResponse(errorToProcess);
      this.handleWsResponse(host, socketResponse);
    }
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  /**
   * Extrae información de infraestructura relevante
   */
  /*private getInfraContext(host: ArgumentsHost, type: ContextType): IErrorContext {
    if (type === 'http') {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();
      
      return {
        path: request.url,
        dirIp: request.ip,
        method: request.method,
        actorId: request.user?.id || request.user?.userId || 'anonymous',
        operation: 'HTTP_REQUEST',
      };
    } 
    */
  private getInfraContext(host: ArgumentsHost, type: ContextType): IErrorContext {
    if (type === 'http') {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();
      
      // Capturamos la IP real si estás tras un proxy (como Nginx o Cloudflare)
      const realIp = request.headers['x-forwarded-for'] || request.ip;
      
      // El User-Agent nos dirá si es un bot de escaneo (ej. "sqlmap", "python-requests")
      const userAgent = request.headers['user-agent'] || 'unknown';

      return {
        path: request.url,
        dirIp: realIp,
        method: request.method,
        actorId: request.user?.id || request.user?.userId || 'anonymous',
        operation: 'HTTP_REQUEST',
        // Te recomiendo añadir estos campos a tu interfaz IErrorContext si es posible:
        userAgent: userAgent,
        referer: request.headers['referer'] || 'none',
      };
    }
    if (type === 'ws') {
      const wsCtx = host.switchToWs();
      const client = wsCtx.getClient();
      const socketData = client?.data || {};

      return {
        pattern: wsCtx.getPattern(),
        data: wsCtx.getData(),
        socketId: client?.id || 'NO-SOCKET-ID',
        userId: socketData.userId || 'ANONYMOUS',
        roomId: socketData.roomPin || 'NO-ROOM',
        operation: 'WS_EVENT',
      };
    }

    return {};
  }

  /**
   * Unifica cualquier tipo de error en ErrorData.
   */
  private resolveErrorData(exception: unknown, infraContext: IErrorContext): ErrorData {
    if (isErrorData(exception)) {
      const ctx = { ...infraContext, ...exception.details };
      if (!exception.details?.operation) {
        ctx.operation = infraContext.operation;
      }
      // return exception.setContext(ctx); // Si ErrorData es mutable, úsalo así
      // Si no, asignamos manualmente (asumiendo que ErrorData lo permite o se clona)
      // Como tu ErrorData parece tener setContext o ser mutable:
      return exception; 
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse() as any;
      const details = typeof responseBody === 'object' ? responseBody : { message: responseBody };

      return new ErrorData(
        details.error || `HTTP_ERROR_${status}`,
        details.message || exception.message,
        status >= 500 ? ErrorLayer.INFRASTRUCTURE : ErrorLayer.APPLICATION,
        { ...infraContext, ...details },
        exception
      );
    }

    if (exception instanceof WsException) {
      const errorData = exception.getError() as any;
      const message = typeof errorData === 'string' ? errorData : errorData.message;

      return new ErrorData(
        'WS_ERROR',
        message,
        ErrorLayer.INFRASTRUCTURE,
        infraContext,
        exception
      );
    }

    return new ErrorData(
      'APPLICATION_UNEXPECTED_ERROR',
      (exception as Error)?.message || 'Internal Server Error',
      ErrorLayer.APPLICATION,
      infraContext,
      exception as Error
    );
  }

  /**
   * Maneja el envío de respuesta vía HTTP.
   */
  private handleHttpResponse(host: ArgumentsHost, clientResponse: IErrorResponse): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    if (!response.headersSent) {
      response.status(clientResponse.status).json(clientResponse);
    }
  }

  /**
   * Maneja el envío de respuesta vía WebSocket.
   * CAMBIO: Ahora recibe IMappedSocketError para saber QUÉ evento emitir y con QUÉ datos.
   */
  private handleWsResponse(host: ArgumentsHost, socketResponse: IMappedSocketError): void {
    const wsCtx = host.switchToWs();
    const client = wsCtx.getClient();

    if (client && typeof client.emit === 'function') {
      // 1. Usamos el evento dinámico calculado por el servicio (FATAL_ERROR, SYNC_ERROR, etc.)
      // 2. Enviamos el objeto 'data' completo (que incluye statusCode, message, error, errorId)
      client.emit(socketResponse.event, socketResponse.data);
    } else {
      this.logger.warn('No se pudo emitir el error WS al cliente (Cliente desconectado o inválido)');
    }
  }
}