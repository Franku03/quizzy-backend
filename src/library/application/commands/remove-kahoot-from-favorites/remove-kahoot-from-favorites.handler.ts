import { RemoveKahootFromFavoritesCommand } from './remove-kahoot-from-favorites.command';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { Inject } from '@nestjs/common';
import { Optional } from 'src/core/types/optional';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';

@CommandHandler(RemoveKahootFromFavoritesCommand)
export class RemoveKahootFromFavoritesHandler
  implements ICommandHandler<RemoveKahootFromFavoritesCommand>
{
  constructor(
    @Inject(RepositoryName.User) private readonly userRepo: IUserRepository,
  ) {}

  async execute(
    query: RemoveKahootFromFavoritesCommand,
  ): Promise<Optional<Error>> {
    try {
      // construir kahoot y user id con logica de dominio
      const userUUID: UserId = new UserId(query.userId);
      const kahootUUID: KahootId = new KahootId(query.kahootId);
      // hidratamos el objeto de dominio
      const user = await this.userRepo.findUserById(userUUID);
      if (!user) return new Optional<Error>(new Error('User not found'));
      // removemos el kahoot
      user?.removeFavorite(kahootUUID);
      // guardamos el usuario
      await this.userRepo.save(user);
      // retornamos optional sin errores
      return new Optional<Error>();
    } catch (err: any) {
      return new Optional<Error>(err);
    }
  }
}
