/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\infrastructure\services\command-query-executor.service.ts

import { Injectable } from '@nestjs/common';
import { CommandBus } from 'src/core/infrastructure/cqrs/buses/command-bus';
import { QueryBus } from 'src/core/infrastructure/cqrs/buses/query-bus';
import { throwResult } from 'src/core/errors/helpers/exception-bridge.helper';

@Injectable()
export class CommandQueryExecutorService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async executeCommand<T>(command: any): Promise<T> {
    const result = await this.commandBus.execute(command);
    return throwResult<T>(result);
  }

  async executeQuery<T>(query: any): Promise<T> {
    const result = await this.queryBus.execute(query);
    return throwResult<T>(result);
  }

  async executeCommandsInParallel<T>(commands: any[]): Promise<T[]> {
    return Promise.all(commands.map((cmd) => this.executeCommand<T>(cmd)));
  }

  async executeQueriesInParallel<T>(queries: any[]): Promise<T[]> {
    return Promise.all(queries.map((query) => this.executeQuery<T>(query)));
  }
}
