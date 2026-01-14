import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { DeleteUserCommand } from './delete-user.command';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { ICommandHandler } from 'src/core/application/cqrs';
import { CommandHandler } from 'src/core/infrastructure/cqrs';
import { BackOfficeUserReadModel } from '../../read-model/backoffice-user.read.model';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { User } from 'src/users/domain/aggregates/user';
import type { IDeletedUserHasher } from 'src/users/domain/domain-services/deleted-user-hashed.interface';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @Inject(RepositoryName.User) private readonly userRepo: IUserRepository,
    @Inject('IDeletedUserHasher')
    private readonly deletedUserHasher: IDeletedUserHasher,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
  ) {}

  private readonly context = {
    useCase: 'DeleteUser',
    module: 'backoffice',
  };

  @Log()
  async execute(
    command: DeleteUserCommand,
  ): Promise<Either<ErrorData, BackOfficeUserReadModel>> {

    if (command.adminId === command.userToDeleteId)
      return this.handleError(
        '400',
        'An user can not delete himself',
        ErrorLayer.APPLICATION,
      );

    // Definicion de Variables
    let adminUUID: UserId;
    let userToDeleteUUID: UserId;

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
      userToDeleteUUID = new UserId(command.userToDeleteId);
    } catch (err: any) {
      return this.handleError(
        '400',
        `Invalid user ID format: ${err?.message || 'Unknown error'}`,
        ErrorLayer.DOMAIN,
        { userToDeleteId: command.userToDeleteId }
      );
    }

    // Verificar que no sea la misma persona
    if (adminUUID.value === userToDeleteUUID.value) {
      return this.handleError(
        '400',
        'Cannot delete yourself',
        ErrorLayer.APPLICATION,
        { 
          adminId: adminUUID.value,
          userToDeleteId: userToDeleteUUID.value 
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

        return Either.makeRight<ErrorData, UserId>(userToDeleteUUID);
      },

      // 3. Buscar el usuario a eliminar
      async (result) => {
        if (result.isLeft()) return result;
        const userId = result.getRight();

        return await this.userRepo.findUserByIdEither(userId);
      },

      // 4. Verificar que el usuario existe y marcarlo como eliminado
      async (result) => {
        if (result.isLeft()) return result;
        const user = result.getRight();

        if (!user) {
          return this.handleError(
            '404',
            'User to delete not found',
            ErrorLayer.APPLICATION,
            { userToDeleteId: userToDeleteUUID.value }
          );
        }

        // Verificar que el usuario no esté ya eliminado
        if (user.isDeleted) {
          return this.handleError(
            '400',
            'User is already deleted',
            ErrorLayer.APPLICATION,
            { 
              userToDeleteId: userToDeleteUUID.value,
              isDeleted: user.isDeleted 
            }
          );
        }

        try {
          // Marcar el usuario como eliminado (soft delete)
          await user.delete(this.deletedUserHasher);
          return Either.makeRight<ErrorData, User>(user);
        } catch (error) {
          return this.handleError(
            '500',
            `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ErrorLayer.DOMAIN,
            { userToDeleteId: userToDeleteUUID.value }
          );
        }
      },

      // 5. Guardar el usuario eliminado Y obtener el read model actualizado en una sola operación
      async (result) => {
        if (result.isLeft()) return result;
        const user = result.getRight();

        return await this.userRepo.saveAndGetBackofficeUserEither(user);
      },

      // 6. Modificar el read model para reflejar que el usuario fue eliminado
      (result) => {
        if (result.isLeft()) return result;
        const readModel = result.getRight();

        // Crear una versión modificada del read model para usuarios eliminados
        // Podrías querer mostrar información diferente para usuarios eliminados
        const deletedReadModel = new BackOfficeUserReadModel(
          readModel.id,
          `[DELETED] ${readModel.username}`, // Marcar como eliminado
          readModel.name,
          readModel.email,
          'This user has been deleted', // Cambiar descripción
          readModel.userType,
          null, // Remover avatar
          readModel.createdAt,
          readModel.updatedAt,
          readModel.isAdmin,
          'Deleted' // Cambiar status
        );

        return Either.makeRight<ErrorData, BackOfficeUserReadModel>(deletedReadModel);
      },
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