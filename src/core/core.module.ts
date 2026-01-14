/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\core.module.ts

import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Tokens
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';

// Implementaciones
import { InMemoryEventBus } from './infrastructure/event-buses/memory-event-bus';
import { UuidGenerator } from './infrastructure/adapters/idgenerator/uuid-generator';
import { PinoLogger } from './infrastructure/loggers/pino.logger';
import { NodeCryptoService } from './infrastructure/adapters/nodecryptoservice/node-crypto.service';

// Servicios y CQRS
import { CoreController } from './nest-js/core.controller';
import { CommandBus } from './infrastructure/cqrs/buses/command-bus';
import { QueryBus } from './infrastructure/cqrs/buses/query-bus';
import { CqrsBootstrapService } from './infrastructure/cqrs/cqrs-bootstrap.service';
import { CommandQueryExecutorService } from './infrastructure/services/command-query-executor.service';
import { ErrorMappingService } from './infrastructure/services/global-error-mapping.service';
import { AllExceptionsFilter } from './infrastructure/filters/all-exceptions.filter';
import { ResultInterceptor } from './infrastructure/interceptors/response.interceptor';

@Global()
@Module({
  controllers: [CoreController],
  providers: [
    CommandQueryExecutorService,
    CqrsBootstrapService,
    CommandBus,
    QueryBus,
    ErrorMappingService,

    // 1. REGISTRO DE CLASES (Para que sean inyectables por nombre)
    AllExceptionsFilter,
    ResultInterceptor,

    // 2. VINCULACIÓN CON TOKENS GLOBALES (Uso de la misma instancia)
    {
      provide: APP_INTERCEPTOR,
      useExisting: ResultInterceptor,
    },
    {
      provide: APP_FILTER,
      useExisting: AllExceptionsFilter,
    },

    // ID Generator centralizado
    {
      provide: APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR,
      useClass: UuidGenerator,
    },

    // Event Bus
    {
      provide: EVENT_BUS_TOKEN,
      useClass: InMemoryEventBus,
    },

    // Logger centralizado
    {
      provide: APPLICATION_CORE_TOKENS.UTILS.LOGGER,
      useClass: PinoLogger,
    },

    // Crypto Service
    {
      provide: APPLICATION_CORE_TOKENS.UTILS.CRYPTO_SERVICE,
      useClass: NodeCryptoService,
    },
  ],
  exports: [
    CommandBus,
    QueryBus,
    ErrorMappingService,
    CommandQueryExecutorService,
    EVENT_BUS_TOKEN,
    AllExceptionsFilter, // Exportado para acceso externo
    ResultInterceptor, // Exportado para acceso externo
    APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR,
    APPLICATION_CORE_TOKENS.UTILS.LOGGER,
    APPLICATION_CORE_TOKENS.UTILS.CRYPTO_SERVICE,
  ],
})
export class CoreModule {}
