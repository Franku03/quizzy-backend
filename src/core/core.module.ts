// src/core/core.module.ts

import { Global, Module } from '@nestjs/common';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';
import { InMemoryEventBus } from './infrastructure/event-buses/memory-event-bus';
import { UuidGenerator } from './infrastructure/event-buses/idgenerator/uuid-generator';
import { ErrorMappingService } from './infrastructure/services/global-error-mapping.service';
import { CoreController } from './nest-js/core.controller';

@Global() 
@Module({
    controllers: [CoreController],
    providers: [
        { provide: EVENT_BUS_TOKEN, useClass: InMemoryEventBus },
        UuidGenerator,
        ErrorMappingService,
    ],
    exports: [
        EVENT_BUS_TOKEN,
        UuidGenerator,
        ErrorMappingService,
    ]
})
export class CoreModule {}