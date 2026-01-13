/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\commands\delete-kahoot\delete-kahoot.handler.ts

import { Inject } from '@nestjs/common';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { Either, ErrorData } from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { KahootOwnershipAuthorizer, IKahootOwnershipRequest } from 'src/core/application/aspects/auth/strategies/kahootOwnership.strategy';
import type { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { DeleteKahootCommand } from './delete-kahoot.command';
import { AttemptCleanupService } from '../../services/attempt-clear.service';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { createKahootAppContext } from '../context/base-kahoot-context';

@CommandHandler(DeleteKahootCommand)
export class DeleteKahootHandler implements ICommandHandler<DeleteKahootCommand> {

  constructor(
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository,
    private readonly attemptCleanup: AttemptCleanupService,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
  ) { }

  @Log()
  @Authorize(KahootOwnershipAuthorizer, 'kahootRepository')
  async execute(
    command: DeleteKahootCommand & IKahootOwnershipRequest
  ): Promise<Either<ErrorData, void>> {

    const appContext = createKahootAppContext('deleteKahoot', command.kahootId, command.userId);

    return pipeAsync<ErrorData, void>(
      // 1. Recuperación: Usamos el recurso ya validado por el Authorizer
      Either.makeRight<ErrorData,Kahoot>(command.validatedResource as Kahoot)
        .mapLeft(err => err.setContext(appContext)),

      // 2. Ejecución del borrado
      k => k.chainAsync(kahoot => this.kahootRepository.deleteKahootEither(kahoot.id.value)),

      // 3. Efectos secundarios (Limpieza attempts)
      res => this.handlePostDeleteEffects(res, command.id)
    );
  }

  /**
   * Maneja tareas post-eliminación sin bloquear la respuesta principal.
   */
  private handlePostDeleteEffects(
    result: Either<ErrorData, void>, 
    id: string
  ): Either<ErrorData, void> {
    if (result.isRight()) {
      this.attemptCleanup.cleanupById(new KahootId(id))
        .catch(err => this.logger.error(`Cleanup failed for kahoot ${id}`, err));
    }
    return result;
  }
}