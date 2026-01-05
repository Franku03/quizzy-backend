import { RemoveKahootFromFavoritesCommand } from './remove-kahoot-from-favorites.command';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { Inject } from '@nestjs/common';
import { Optional } from 'src/core/types/optional';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { User } from 'src/users/domain/aggregates/user';

@CommandHandler(RemoveKahootFromFavoritesCommand)
export class RemoveKahootFromFavoritesHandler
  implements ICommandHandler<RemoveKahootFromFavoritesCommand>
{
  private readonly context = {
    useCase: 'RemoveKahootFromFavorites',
    module: 'library',
  };

  constructor(
    @Inject(RepositoryName.User) private readonly userRepo: IUserRepository,
  ) {}

  async execute(
    query: RemoveKahootFromFavoritesCommand,
  ): Promise<Optional<ErrorData>> {
    // Definicion de Variables
    let userUUID: UserId;
    let kahootUUID: KahootId;
    let user: User | null;

    // Manejo de Dominio
    try {
      // construir kahoot y user id con logica de dominio
      userUUID = new UserId(query.userId);
      kahootUUID = new KahootId(query.kahootId);
    } catch (err: any) {
      return this.handleError(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (err?.message as string) ? '400' : '500',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (err?.message as string) || 'Unknown domain Error.',
        ErrorLayer.DOMAIN,
      );
    }

    //Manejo de Infraestructura (bases de datos)
    try {
      // hidratamos el objeto de dominio
      user = await this.userRepo.findUserById(userUUID);
      if (!user)
        return this.handleError(
          '404',
          'User not found',
          ErrorLayer.INFRASTRUCTURE,
        );
      // removemos el kahoot
      user?.removeFavorite(kahootUUID);
      // guardamos el usuario
      await this.userRepo.save(user);
      // retornamos optional sin errores
      return new Optional<ErrorData>();
    } catch (err: any) {
      return this.handleError(
        '500',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (err?.message as string) || 'Unknown database Error.',
        ErrorLayer.INFRASTRUCTURE,
      );
    }
  }

  private handleError(
    code: string,
    errorMessage: string,
    errorLayer: ErrorLayer,
  ): Optional<ErrorData> {
    return new Optional<ErrorData>(
      new ErrorData(code, errorMessage, errorLayer, { ...this.context }),
    );
  }
}
