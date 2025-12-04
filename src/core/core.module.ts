// src/core/core.module.ts

import { Global, Module } from '@nestjs/common';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';
import { InMemoryEventBus } from './infrastructure/event-buses/memory-event-bus';
import { UuidGenerator } from './infrastructure/event-buses/idgenerator/uuid-generator';

@Global() 
@Module({
    providers: [
        { provide: EVENT_BUS_TOKEN, useClass: InMemoryEventBus },
        UuidGenerator,
    ],
    exports: [
        EVENT_BUS_TOKEN,
        UuidGenerator, 
    ]
})
export class CoreModule {}