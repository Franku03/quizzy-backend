import { Global, Module } from '@nestjs/common';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';
import { InMemoryEventBus } from './infrastructure/event-buses/memory-event-bus';
import { UuidGenerator } from './infrastructure/adapters/idgenerator/uuid-generator';
import { ErrorMappingService } from './infrastructure/services/global-error-mapping.service';
import { CoreController } from './nest-js/core.controller';
import { CommandBus } from './infrastructure/cqrs/buses/command-bus';
import { QueryBus } from './infrastructure/cqrs/buses/query-bus';
import { CqrsBootstrapService } from './infrastructure/cqrs/cqrs-bootstrap.service';
import { ID_GENERATOR } from './application/ports/crypto/core-application.tokens';
import { CommandQueryExecutorService } from './infrastructure/services/command-query-executor.service';


@Global()
@Module({
  controllers: [CoreController],
  providers: [
    CommandQueryExecutorService,
    { provide: ID_GENERATOR, useClass: UuidGenerator },
    CqrsBootstrapService,
    CommandBus,
    QueryBus,
    { provide: EVENT_BUS_TOKEN, useClass: InMemoryEventBus },
    ErrorMappingService,
  ],
  exports: [
    CommandBus,
    QueryBus,
    EVENT_BUS_TOKEN,
    ID_GENERATOR,
    ErrorMappingService,
    CommandQueryExecutorService,
  ]
})
export class CoreModule {}