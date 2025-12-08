import { Global, Module } from '@nestjs/common';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';
import { InMemoryEventBus } from './infrastructure/event-buses/memory-event-bus';
import { UuidGenerator } from './infrastructure/event-buses/idgenerator/uuid-generator';
import { ErrorMappingService } from './infrastructure/services/global-error-mapping.service';
import { CoreController } from './nest-js/core.controller';
import { CommandBus } from './infrastructure/cqrs/buses/command-bus';
import { QueryBus } from './infrastructure/cqrs/buses/query-bus';
import { CqrsBootstrapService } from './infrastructure/cqrs/cqrs-bootstrap.service';

@Global()
@Module({
  controllers: [CoreController],
  providers: [
    UuidGenerator,
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
    UuidGenerator,
    ErrorMappingService,
  ]
})
export class CoreModule {}