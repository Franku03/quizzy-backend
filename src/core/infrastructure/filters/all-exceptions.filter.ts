/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\infrastructure\filters\all-exceptions.filter.ts

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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    @Inject(ErrorMappingService)
    private readonly errorMappingService: ErrorMappingService,
  ) { }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    /**
     * 1. Creamos el contexto de infraestructura.
     * Aunque IErrorContext no declare 'path' o 'method', el index signature 
     * [key: string]: any permite que TS acepte este objeto sin chillar.
     */
    const infraContext: IErrorContext = {
      path: request.url,
      method: request.method,
      actorId: request.user?.id || request.user?.userId || 'anonymous',
      operation: 'HTTP_REQUEST', // Solo se usará si el ErrorData no trae una operación propia
    };

    let errorToProcess: ErrorData;

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

    // --- ESCENARIO 3: Errores de Runtime (Crashes, bugs de código) ---
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

    // 4. RESPUESTA HTTP
    response.status(clientResponse.status).json(clientResponse);
  }
}