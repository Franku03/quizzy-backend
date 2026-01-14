import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { UnblockUserCommand } from './unblock-user.command';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { ICommandHandler } from 'src/core/application/cqrs';
import { CommandHandler } from 'src/core/infrastructure/cqrs';
import { BackOfficeUserReadModel } from '../../read-model/backoffice-user.read.model';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { User } from 'src/users/domain/aggregates/user';

@CommandHandler(UnblockUserCommand)
export class UnblockUserHandler implements ICommandHandler<UnblockUserCommand> {
  constructor(
    private readonly mediaService: MediaEnrichmentService,
    @Inject(RepositoryName.User) private readonly userRepo: IUserRepository,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
  ) {}

  private readonly context = {
    useCase: 'UnblockUser',
    module: 'backoffice',
  };

  @Log()
  async execute(
    command: UnblockUserCommand,
  ): Promise<Either<ErrorData, BackOfficeUserReadModel>> {
    // Definicion de Variables
    let userUUID: UserId;

    // Manejo de Errores de Dominio
    try {
      userUUID = new UserId(command.userToUnblockId);
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

      // 2. Verificar que existe y desbloquearlo
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

        // Verificar que el usuario esté bloqueado antes de desbloquear
        if (!user.isBlocked()) {
          return this.handleError(
            '400',
            'User is not blocked',
            ErrorLayer.APPLICATION,
            { 
              userId: userUUID.value,
              currentState: user.state
            },
          );
        }

        // Desbloquear el usuario
        user.unblock();

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