// src/core/filters/all-exceptions.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
  Logger,
} from '@nestjs/common';

import { ErrorData, ErrorLayer } from 'src/core/types';
import { ErrorMappingService } from '../services/global-error-mapping.service';
import { IErrorResponse } from 'src/core/errors/interface/i-error-response.interface';
import { isErrorData } from 'src/core/errors/type-guards.ts/error-data.type.guard';
import { IErrorContext } from 'src/core/errors/interface/context/i-error-context.interface';
import { WsException } from '@nestjs/websockets';
import { ServerErrorEvents } from 'src/multiplayer-sessions/infrastructure/nest-js/enums/websocket.events.enum';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    @Inject(ErrorMappingService)
    private readonly errorMappingService: ErrorMappingService,
  ) { }

  catch(exception: unknown, host: ArgumentsHost) {
    // const ctx = host.switchToHttp();
    // const response = ctx.getResponse();
    // const request = ctx.getRequest();

    const type = host.getType(); // 'http' o 'ws'
    let errorToProcess: ErrorData;
    let infraContext: IErrorContext = {};

    // --- 1. CAPTURA DE CONTEXTO SEGÚN EL TIPO ---
      /**
     * Creamos el contexto de infraestructura.
     * Aunque IErrorContext no declare 'path' o 'method', el index signature 
     * [key: string]: any permite que TS acepte este objeto sin chillar.
     */
    if (type === 'http') {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();
      infraContext = {
        path: request.url,
        method: request.method,
        actorId: request.user?.id || request.user?.userId || 'anonymous',
        operation: 'HTTP_REQUEST', // Solo se usará si el ErrorData no trae una operación propia
      };
    } else if (type === 'ws') {
      const wsCtx = host.switchToWs();
      const client = wsCtx.getClient();
      
      // Seguridad extra: Nos aseguramos de que 'client' y 'client.data' existan
      const socketData = client?.data || {}; 

      infraContext = {
        pattern: wsCtx.getPattern(),
        data: wsCtx.getData(),
        socketId: client?.id || 'NO-SOCKET-ID',
        userId: socketData.userId || 'ANONYMOUS',
        roomId: socketData.roomPin || 'NO-ROOM',
        operation: 'WS_EVENT',
      };
    }

    // const infraContext: IErrorContext = {
    //   path: request.url,
    //   method: request.method,
    //   actorId: request.user?.id || request.user?.userId || 'anonymous',
    //   operation: 'HTTP_REQUEST', // Solo se usará si el ErrorData no trae una operación propia
    // };

    // let errorToProcess: ErrorData;

    // --- ESCENARIO 1: ErrorData (ROP / Dominio / UseCases) ---
    if (isErrorData(exception)) {
      // setContext protege la 'operation' original si ya existe (ej. 'CreateKahoot')
      errorToProcess = exception //.setContext(infraContext);
    } 

    // --- ESCENARIO 2: HttpException (Nest nativo, ej. ValidationPipe) ---
    else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse() as any;

      errorToProcess = new ErrorData(
        responseBody.error || `HTTP_ERROR_${status}`,
        responseBody.message || exception.message,
        status >= 500 ? ErrorLayer.INFRASTRUCTURE : ErrorLayer.APPLICATION,
        { ...infraContext, ...responseBody.details },
        exception
      );
    }
    // --- ESCENARIO 3: Errores de WS ---
 
    else if (exception instanceof WsException) {
        // Para errores específicos de WS
        const errorData = exception.getError() as any;

        errorToProcess = new ErrorData(
            'WS_ERROR',
            typeof errorData === 'string' ? errorData : errorData.message,
            ErrorLayer.INFRASTRUCTURE,
            infraContext,
            exception
        );
    }

    // --- ESCENARIO 4: Errores de Runtime (Crashes, bugs de código) ---
    else {
      errorToProcess = new ErrorData(
        'APPLICATION_UNEXPECTED_ERROR',
        (exception as Error)?.message || 'Internal Server Error',
        ErrorLayer.APPLICATION,
        infraContext,
        exception as Error
      );
    }

    // 2. LOGGING: Consola completa para el desarrollador (Con colores y stack trace)
    this.logger.error(errorToProcess.toLogString());

    // 3. MAPPING: Sanitizamos la respuesta para el cliente (Borra credenciales si es 500)
    const clientResponse: IErrorResponse = this.errorMappingService.toClientResponse(errorToProcess);

    // 4. RESPUESTA

    if (type === 'http') {
      // 4.1 RESPUESTA HTTP
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      response.status(clientResponse.status).json(clientResponse);
    } else if (type === 'ws') {

      // 4.2 RESPUESTA EMISION EVENTO WS
      const wsCtx = host.switchToWs();
      const client = wsCtx.getClient();
      // En WebSockets, enviamos un evento de error al cliente
      // LOGICA DE SEGURIDAD: 
      // Algunos adaptadores de WS no tienen el método 'emit' directo en el cliente
      // o el cliente podría estar desconectado en el momento del error.
      if (client && typeof client.emit === 'function') {

        client.emit(ServerErrorEvents.FATAL_ERROR, clientResponse); 
        // Nota: Nest por defecto busca el evento 'exception' en el cliente
      }
    }
    // 4. RESPUESTA HTTP
    // response.status(clientResponse.status).json(clientResponse);
  }
}