import { Global, Module } from '@nestjs/common';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';
import { InMemoryEventBus } from './infrastructure/event-buses/memory-event-bus';

// CoreModule is a global module that provides core services and utilities
// to the entire application. It is marked as @Global to ensure that its providers
// are available throughout the app without needing to import the module in every other module.
@Global() 
@Module({
    providers: [
        // Registering the InMemoryEventBus as the implementation for the EventBus interface
        // using the EVENT_BUS_TOKEN for dependency injection.
        // This allows other parts of the application to inject the EventBus
        // without being tightly coupled to the InMemoryEventBus implementation.
        // It also enables singleton behavior for the EventBus across the application.
        {
            provide: EVENT_BUS_TOKEN,
            useClass: InMemoryEventBus
        }
    ],
    exports: [
        // Exporting the EVENT_BUS_TOKEN so that other modules can use the EventBus service.
        // This makes the EventBus available for injection in other parts of the application.
        EVENT_BUS_TOKEN 
    ]
})
export class CoreModule {}