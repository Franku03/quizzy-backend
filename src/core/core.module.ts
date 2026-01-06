import { Global, Module } from '@nestjs/common';

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

@Global()
@Module({
  controllers: [CoreController],
  providers: [
    CommandQueryExecutorService,
    CqrsBootstrapService,
    CommandBus,
    QueryBus,
    ErrorMappingService,

    // ID Generator centralizado
    { 
      provide: APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR, 
      useClass: UuidGenerator 
    },

    // Event Bus (Se mantiene normal/original)
    { 
      provide: EVENT_BUS_TOKEN, 
      useClass: InMemoryEventBus 
    },

    // Logger centralizado
    {
      provide: APPLICATION_CORE_TOKENS.UTILS.LOGGER,
      useClass: PinoLogger,
    },

    // Crypto Service (Agregado para resolver el error)
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
    APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR,
    APPLICATION_CORE_TOKENS.UTILS.LOGGER,
    APPLICATION_CORE_TOKENS.UTILS.CRYPTO_SERVICE,
  ],
})
export class CoreModule {}