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

@Catch() // Captura todas las excepciones, incluyendo ErrorData y NestJS HttpExceptions
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
    
    // 1. MANEJO DE ERRORES (ErrorData) - Basically cualquier instancia de errorData.
    if (isErrorData(exception)) {
        // Mapea el ErrorData interno a la respuesta canónica IErrorResponse.
        clientResponse = this.errorMappingService.toClientResponse(exception);
        this.logger.error(exception.toLogString());
        
    } 
    // 2. MANEJO DE EXCEPCIONES NATIVAS DE NESTJS (ej. validación de DTO/Pipes, 404 de rutas)
    else if (exception instanceof HttpException) {
        const status = exception.getStatus();
        const responseBody = exception.getResponse() as any;
        
        // Creamos un cuerpo de respuesta IErrorResponse basado en la excepción nativa de NestJS.
        clientResponse = {
            status: status,
            // Usamos el código de error nativo de NestJS (ej. 'Bad Request')
            code: responseBody.error || `HTTP_ERROR_${status}`, 
            message: responseBody.message || exception.message,
            details: responseBody.details || (responseBody.message ? { message: responseBody.message } : undefined),
            // Generamos un ID de error único para trazar este fallo nativo
            errorId: new ErrorData('HTTP_EXCEPTION', 'NestJS native error', ErrorLayer.APPLICATION).errorId,
        };
    } 
    // 3. MANEJO DE ERRORES DE RUNTIME O DESCONOCIDOS (Fallback a 500)
    else {
        // Esto captura fallos de programación o errores de librería que no lanzaron HttpException ni ErrorData.
        
        // Mapeamos el error desconocido como un fallo interno (APPLICATION_UNEXPECTED_ERROR)
        const unexpectedErrorData = new ErrorData(
            'APPLICATION_UNEXPECTED_ERROR',
            (exception as Error)?.message || 'Internal Server Error (Unknown type)',
            ErrorLayer.APPLICATION,
            { path: request.url },
            exception as Error
        );
        // Usamos el mapper para obtener el cuerpo 500 canónico
        clientResponse = this.errorMappingService.toClientResponse(unexpectedErrorData);
    }
    
    // 4. ENVÍO DE RESPUESTA FINAL
    // Usamos el 'status' determinado por el ErrorMappingService o la HttpException.
    response
      .status(clientResponse.status)
      .json(clientResponse);
  }
}