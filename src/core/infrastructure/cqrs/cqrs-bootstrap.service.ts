import { Injectable, OnModuleInit } from '@nestjs/common';
import { CommandRegistry } from './registries/command.registry';
import { QueryRegistry } from './registries/query.registry';
import { ModuleRef } from '@nestjs/core';
import { CommandBus } from './buses/command-bus';
import { QueryBus } from './buses/query-bus';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';

@Injectable()
export class CqrsBootstrapService implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  onModuleInit() {
    this.bootstrapCommands();
    this.bootstrapQueries();
  }

  private bootstrapCommands() {
    const registrations = CommandRegistry.getRegistrations();

    for (const { command, handler } of registrations) {
      try {
        const handlerInstance: ICommandHandler = this.moduleRef.get(handler, {
          strict: false,
        });
        if (handlerInstance) {
          this.commandBus.register(command, handlerInstance);
          console.log(
            `[CQRS] Command handler registered: ${command.name} -> ${handler.name}`,
          );
        }
      } catch (error) {
        console.warn(
          `[CQRS] Could not register command handler for ${command.name}:`,
          error,
        );
      }
    }
  }

  private bootstrapQueries() {
    const registrations = QueryRegistry.getRegistrations();

    for (const { query, handler } of registrations) {
      try {
        const handlerInstance: IQueryHandler = this.moduleRef.get(handler, {
          strict: false,
        });
        if (handlerInstance) {
          this.queryBus.register(query, handlerInstance);
          console.log(
            `[CQRS] Query handler registered: ${query.name} -> ${handler.name}`,
          );
        }
      } catch (error) {
        console.warn(
          `[CQRS] Could not register query handler for ${query.name}:`,
          error,
        );
      }
    }
  }
}
