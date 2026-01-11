/**
 * MIT License | Copyright (c) 2026
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 */

// File: src\core\infrastructure\interceptors\result.interceptor.ts

// --- Externals & Core ---
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { Either } from 'src/core/types/either';
import { ErrorData } from 'src/core/types';
import { ErrorMappingService } from '../services/global-error-mapping.service';

@Injectable()
export class ResultInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResultInterceptor.name);

  constructor(private readonly errorMappingService: ErrorMappingService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const type = context.getType();

    return next.handle().pipe(
      map((result) => {
        // 1. FAST PATH: Éxito o no es Either (Mínima latencia)
        if (!Either.isEither(result)) return result;
        if (result.isRight()) return result.getRight();

        // 2. ERROR PATH: Casteo explícito para evitar errores de TS
        const errorData = result.getLeft() as ErrorData;

        // Logging en el siguiente tick para no retrasar el Response Time Global
        setImmediate(() => {
          this.logger.error(errorData.toLogString());
        });

        // 3. HIJACK POR PROTOCOLO
        if (type === 'http') {
          const res: Response = context.switchToHttp().getResponse();
          const mapped = this.errorMappingService.toClientResponse(errorData);
          
          if (!res.headersSent) {
            res.status(mapped.status).json(mapped);
          }
          return null; // Cortamos el flujo de NestJS
        }

        if (type === 'ws') {
          const client = context.switchToWs().getClient();
          const mappedWs = this.errorMappingService.toSocketResponse(errorData);
          
          if (client?.emit) {
            client.emit(mappedWs.event, mappedWs.data);
          }
          // Devolvemos el error para que el 'acknowledgement' del socket lo reciba
          return { status: 'error', ...mappedWs.data };
        }

        return result;
      }),
    );
  }
}