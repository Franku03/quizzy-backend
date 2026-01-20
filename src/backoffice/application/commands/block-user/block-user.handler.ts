/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\application\commands\block-user\block-user.handler.ts

import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { BlockUserCommand } from './block-user.command';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { ICommandHandler } from 'src/core/application/cqrs';
import { CommandHandler } from 'src/core/infrastructure/cqrs';
import { BackOfficeUserReadModel } from '../../read-model/backoffice-user.read.model';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { User } from 'src/users/domain/aggregates/user';

@CommandHandler(BlockUserCommand)
export class BlockUserHandler implements ICommandHandler<BlockUserCommand> {
  constructor(
    private readonly mediaService: MediaEnrichmentService,
    @Inject(RepositoryName.User) private readonly userRepo: IUserRepository,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
  ) {}

  private readonly context = {
    useCase: 'BlockUser',
    module: 'backoffice',
  };

  @Log()
  async execute(
    command: BlockUserCommand,
  ): Promise<Either<ErrorData, BackOfficeUserReadModel>> {
    // Definicion de Variables
    let userUUID: UserId;

    if (command.adminId === command.userToBeBlockedId)
      return this.handleError(
        '400',
        'An user can not block himself',
        ErrorLayer.APPLICATION,
      );

    // Manejo de Errores de Dominio
    try {
      userUUID = new UserId(command.userToBeBlockedId);
    } catch (err: any) {
      return this.handleError(
        '400',
        err?.message || 'Invalid user ID format',
        ErrorLayer.DOMAIN,
      );
    }

    return pipeAsync<ErrorData, BackOfficeUserReadModel>(
      // 1. Buscar el usuario como User (agregado de dominio)
      this.userRepo.findUserByIdEither(userUUID),

      // 2. Verificar que existe y bloquearlo
      (result) => {
        if (result.isLeft()) return result;
        const user = result.getRight();

        if (!user) {
          return this.handleError(
            '404',
            'User not found',
            ErrorLayer.APPLICATION,
            { userId: userUUID.value },
          );
        }

        // Bloquear el usuario
        user.block();

        return Either.makeRight<ErrorData, User>(user);
      },

      // 3. Guardar el usuario Y obtener el read model actualizado en una sola operación
      async (result) => {
        if (result.isLeft()) return result;
        const user = result.getRight();

        return await this.userRepo.saveAndGetBackofficeUserEither(user);
      },

      // 4. Enriquecemos los media assets (avatarUrl) para convertirlos en URLs
      (res) =>
        res.mapAsync((readModel) =>
          this.mediaService.enrinchBackofficeUserReadModel(
            readModel as BackOfficeUserReadModel,
          ),
        ),
    );
  }

  private handleError(
    code: string,
    errorMessage: string,
    errorLayer: ErrorLayer,
    extraContext?: Record<string, unknown>,
  ): Either<ErrorData, BackOfficeUserReadModel> {
    return Either.makeLeft<ErrorData, BackOfficeUserReadModel>(
      new ErrorData(code, errorMessage, errorLayer, {
        ...this.context,
        ...extraContext,
      }),
    );
  }
}
