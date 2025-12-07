import { Global, Module } from '@nestjs/common';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';
import { InMemoryEventBus } from './infrastructure/event-buses/memory-event-bus';
import { UuidGenerator } from './infrastructure/event-buses/idgenerator/uuid-generator';
import { CommandBus } from './infrastructure/cqrs/command-bus';
import { QueryBus } from './infrastructure/cqrs/query-bus';

@Global()
@Module({
  providers: [
    UuidGenerator,
    CommandBus,
    QueryBus,
    { provide: EVENT_BUS_TOKEN, useClass: InMemoryEventBus },
  ],
  exports: [CommandBus, QueryBus, EVENT_BUS_TOKEN, UuidGenerator],
})
export class CoreModule {}
