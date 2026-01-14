import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { GiveAdminCommand } from './give-admin.command';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { ICommandHandler } from 'src/core/application/cqrs';
import { CommandHandler } from 'src/core/infrastructure/cqrs';
import { BackOfficeUserReadModel } from '../../read-model/backoffice-user.read.model';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { User } from 'src/users/domain/aggregates/user';
import { UserRole } from 'src/users/domain/value-objects/user.roles';

@CommandHandler(GiveAdminCommand)
export class GiveAdminHandler implements ICommandHandler<GiveAdminCommand> {
  constructor(
    private readonly mediaService: MediaEnrichmentService,
    @Inject(RepositoryName.User) private readonly userRepo: IUserRepository,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
  ) {}

  private readonly context = {
    useCase: 'GiveAdmin',
    module: 'backoffice',
  };

  @Log()
  async execute(
    command: GiveAdminCommand,
  ): Promise<Either<ErrorData, BackOfficeUserReadModel>> {

    if (command.adminId === command.userToGiveAdminId)
      return this.handleError(
        '400',
        'An user can not make himself admin',
        ErrorLayer.APPLICATION,
      );

    // Definicion de Variables
    let adminUUID: UserId;
    let userToGiveAdminUUID: UserId;

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
      userToGiveAdminUUID = new UserId(command.userToGiveAdminId);
    } catch (err: any) {
      return this.handleError(
        '400',
        `Invalid user ID format: ${err?.message || 'Unknown error'}`,
        ErrorLayer.DOMAIN,
        { userToGiveAdminId: command.userToGiveAdminId }
      );
    }

    // Verificar que no sea la misma persona
    if (adminUUID.value === userToGiveAdminUUID.value) {
      return this.handleError(
        '400',
        'Cannot give admin privileges to yourself',
        ErrorLayer.APPLICATION,
        { 
          adminId: adminUUID.value,
          userToGiveAdminId: userToGiveAdminUUID.value 
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

        return Either.makeRight<ErrorData, UserId>(userToGiveAdminUUID);
      },

      // 3. Buscar el usuario al que se le darán permisos de admin
      async (result) => {
        if (result.isLeft()) return result;
        const userId = result.getRight();

        return await this.userRepo.findUserByIdEither(userId);
      },

      // 4. Verificar que el usuario existe y otorgar permisos de admin
      (result) => {
        if (result.isLeft()) return result;
        const user = result.getRight();

        if (!user) {
          return this.handleError(
            '404',
            'User to give admin not found',
            ErrorLayer.APPLICATION,
            { userToGiveAdminId: userToGiveAdminUUID.value }
          );
        }

        // Verificar que el usuario no sea ya admin
        if (user.isAdmin()) {
          return this.handleError(
            '400',
            'User is already an admin',
            ErrorLayer.APPLICATION,
            { 
              userToGiveAdminId: userToGiveAdminUUID.value,
              userRoles: user.roles 
            }
          );
        }

        // Verificar que el usuario no esté bloqueado
        if (user.isBlocked()) {
          return this.handleError(
            '400',
            'Cannot give admin privileges to a blocked user',
            ErrorLayer.APPLICATION,
            { 
              userToGiveAdminId: userToGiveAdminUUID.value,
              userState: user.state 
            }
          );
        }

        // Verificar que el usuario no esté eliminado
        if (user.isDeleted) {
          return this.handleError(
            '400',
            'Cannot give admin privileges to a deleted user',
            ErrorLayer.APPLICATION,
            { 
              userToGiveAdminId: userToGiveAdminUUID.value,
              isDeleted: user.isDeleted 
            }
          );
        }

        // Otorgar permisos de admin
        user.addRole(UserRole.ADMIN);

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