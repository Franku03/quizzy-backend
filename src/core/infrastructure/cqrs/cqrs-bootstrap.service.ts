/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\infrastructure\cqrs\cqrs-bootstrap.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CommandBus } from './buses/command-bus';
import { QueryBus } from './buses/query-bus';
import { CommandRegistry } from './registries/command.registry';
import { QueryRegistry } from './registries/query.registry';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';

@Injectable()
export class CqrsBootstrapService implements OnModuleInit {
  private lastLogTime = Date.now();

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
          this.prettyLog('COMMAND', command.name, handler.name);
        }
      } catch (error) {
        this.prettyError('COMMAND', command.name, error);
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
          this.prettyLog('QUERY', query.name, handler.name);
        }
      } catch (error) {
        this.prettyError('QUERY', query.name, error);
      }
    }
  }

  private prettyLog(type: 'COMMAND' | 'QUERY', name: string, handler: string) {
    const now = Date.now();
    const diff = now - this.lastLogTime;
    this.lastLogTime = now;

    // Colores ANSI
    const reset = '\x1b[0m';
    const bold = '\x1b[1m';
    const green = '\x1b[32m';
    const yellow = '\x1b[33m';
    const cyan = '\x1b[36m';
    const magenta = '\x1b[35m';
    const gray = '\x1b[90m';

    // Formato de fecha Quizzy style
    const timestamp = new Date().toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const isCommand = type === 'COMMAND';
    const typeTag = isCommand ? `${yellow}CMD${reset}` : `${cyan}QRY${reset}`;
    const nameColor = isCommand ? yellow : cyan;

    // Ajuste de espacio para que todo quede en línea
    const padding = ' '.repeat(Math.max(0, 38 - name.length));

    // Estructura final: [Quizzy] - Fecha LOG [CQRS]
    const header = `${green}[Quizzy]${reset} ${gray}- ${reset}${timestamp}    ${green}LOG ${reset}${yellow}[CQRS]${reset}`;

    console.log(
      `${header} ${gray}●${reset} ` +
        `${bold}${typeTag}${reset} ` +
        `${nameColor}${name}${reset} ` +
        `${padding}${magenta}❯❯❯${reset} ` +
        `${magenta}${handler}${reset} ` +
        `${yellow}+${diff}ms${reset}`,
    );
  }

  private prettyError(type: string, name: string, error: any) {
    const reset = '\x1b[0m';
    const red = '\x1b[31m';
    console.warn(`${red}  ✖ [${type}_ERR]${reset} Error en: ${name}`, error);
  }
}
