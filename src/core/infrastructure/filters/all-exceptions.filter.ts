// src/core/filters/all-exceptions.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
  Logger,
} from '@nestjs/common';

// Importamos la estructura de ErrorData
import { ErrorData, ErrorLayer } from 'src/core/types'; 
import { ErrorMappingService } from '../services/global-error-mapping.service';
import { IErrorResponse } from 'src/core/errors/interface/i-error-response.interface'; 
import { isErrorData } from 'src/core/errors/type-guards.ts/error-data.type.guard';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    @Inject(ErrorMappingService)
    private readonly errorMappingService: ErrorMappingService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let clientResponse: IErrorResponse;

    // 1. MANEJO DE ErrorData (Tu estándar ROP)
    if (isErrorData(exception)) {
      clientResponse = this.errorMappingService.toClientResponse(exception);
      // IMPRESIÓN LINDA: Aquí es donde controlas la consola
      this.logger.error(exception.toLogString());
    } 
    
    // 2. MANEJO DE EXCEPCIONES NATIVAS (Pipes, Guards, 404s)
    else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse() as any;

      clientResponse = {
        status: status,
        code: responseBody.error || `HTTP_ERROR_${status}`,
        message: responseBody.message || exception.message,
        details: responseBody.details || (responseBody.message ? { message: responseBody.message } : undefined),
        errorId: `NEST-${Math.random().toString(36).substring(7)}`,
      };

      // Logueamos los 500 nativos, los 400 no suelen necesitar stack trace
      if (status >= 500) {
        this.logger.error(`HttpException ${status}: ${JSON.stringify(responseBody)}`);
      }
    } 
    
    // 3. FALLBACK: Errores de Runtime (Ej: TypeError, ReferenceError)
    else {
      const unexpectedErrorData = new ErrorData(
        'APPLICATION_UNEXPECTED_ERROR',
        (exception as Error)?.message || 'Internal Server Error',
        ErrorLayer.APPLICATION,
        { path: request.url, method: request.method },
        exception as Error
      );

      clientResponse = this.errorMappingService.toClientResponse(unexpectedErrorData);
      
      // IMPORTANTE: Loguear el error inesperado con stack trace para debug
      this.logger.error(unexpectedErrorData.toLogString());
    }

    // 4. RESPUESTA ÚNICA
    response
      .status(clientResponse.status)
      .json(clientResponse);
  }
}