import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { RemoveAdminCommand } from './remove-admin.command';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { ICommandHandler } from 'src/core/application/cqrs';
import { CommandHandler } from 'src/core/infrastructure/cqrs';
import { BackOfficeUserReadModel } from '../../read-model/backoffice-user.read.model';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { User } from 'src/users/domain/aggregates/user';
import { UserRole } from 'src/users/domain/value-objects/user.roles';

@CommandHandler(RemoveAdminCommand)
export class RemoveAdminHandler implements ICommandHandler<RemoveAdminCommand> {
  constructor(
    private readonly mediaService: MediaEnrichmentService,
    @Inject(RepositoryName.User) private readonly userRepo: IUserRepository,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
  ) {}

  private readonly context = {
    useCase: 'RemoveAdmin',
    module: 'backoffice',
  };

  @Log()
  async execute(
    command: RemoveAdminCommand,
  ): Promise<Either<ErrorData, BackOfficeUserReadModel>> {

    if (command.adminId === command.userToRemoveAdminId)
      return this.handleError(
        '400',
        'An user can not remove himself from being admin',
        ErrorLayer.APPLICATION,
      );

    // Definicion de Variables
    let adminUUID: UserId;
    let userToRemoveAdminUUID: UserId;

    // Manejo de Errores de Dominio - Admin ID
    try {
      adminUUID = new UserId(command.adminId);
    } catch (err: any) {
      return this.handleError(
        '400',
        `Invalid admin ID format: ${err?.message || 'Unknown error'}`,
        ErrorLayer.DOMAIN,
        { adminId: command.adminId }
      );
    }

    // Manejo de Errores de Dominio - User ID
    try {
      userToRemoveAdminUUID = new UserId(command.userToRemoveAdminId);
    } catch (err: any) {
      return this.handleError(
        '400',
        `Invalid user ID format: ${err?.message || 'Unknown error'}`,
        ErrorLayer.DOMAIN,
        { userToRemoveAdminId: command.userToRemoveAdminId }
      );
    }

    // Verificar que no sea la misma persona
    if (adminUUID.value === userToRemoveAdminUUID.value) {
      return this.handleError(
        '400',
        'Cannot remove admin privileges from yourself',
        ErrorLayer.APPLICATION,
        { 
          adminId: adminUUID.value,
          userToRemoveAdminId: userToRemoveAdminUUID.value 
        }
      );
    }

    return pipeAsync<ErrorData, BackOfficeUserReadModel>(
      // 1. Verificar que el admin existe y es admin
      this.userRepo.findUserByIdEither(adminUUID),

      // 2. Validar que el admin existe y tiene permisos
      (adminResult) => {
        if (adminResult.isLeft()) return adminResult;
        const admin = adminResult.getRight();

        if (!admin) {
          return this.handleError(
            '404',
            'Admin user not found',
            ErrorLayer.APPLICATION,
            { adminId: adminUUID.value }
          );
        }

        if (!admin.isAdmin()) {
          return this.handleError(
            '403',
            'User does not have admin privileges',
            ErrorLayer.APPLICATION,
            { 
              adminId: adminUUID.value,
              adminRoles: admin.roles 
            }
          );
        }

        return Either.makeRight<ErrorData, UserId>(userToRemoveAdminUUID);
      },

      // 3. Buscar el usuario al que se le quitarán permisos de admin
      async (result) => {
        if (result.isLeft()) return result;
        const userId = result.getRight();

        return await this.userRepo.findUserByIdEither(userId);
      },

      // 4. Verificar que el usuario existe y remover permisos de admin
      (result) => {
        if (result.isLeft()) return result;
        const user = result.getRight();

        if (!user) {
          return this.handleError(
            '404',
            'User to remove admin not found',
            ErrorLayer.APPLICATION,
            { userToRemoveAdminId: userToRemoveAdminUUID.value }
          );
        }

        // Verificar que el usuario sea admin
        if (!user.isAdmin()) {
          return this.handleError(
            '400',
            'User is not an admin',
            ErrorLayer.APPLICATION,
            { 
              userToRemoveAdminId: userToRemoveAdminUUID.value,
              userRoles: user.roles 
            }
          );
        }

        // Verificar que no sea el último admin (opcional - si quieres prevenir dejar el sistema sin admins)
        // Esta validación podría ser más compleja, contando todos los admins en el sistema
        // Por ahora la omitimos, pero puedes agregarla si es necesario

        // Remover permisos de admin
        user.removeRole(UserRole.ADMIN);

        return Either.makeRight<ErrorData, User>(user);
      },

      // 5. Guardar el usuario Y obtener el read model actualizado en una sola operación
      async (result) => {
        if (result.isLeft()) return result;
        const user = result.getRight();

        return await this.userRepo.saveAndGetBackofficeUserEither(user);
      },

      // 6. Enriquecemos los media assets (avatarUrl) para convertirlos en URLs
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