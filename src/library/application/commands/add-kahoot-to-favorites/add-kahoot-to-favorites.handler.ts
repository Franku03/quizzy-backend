import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AddKahootToFavoritesCommand } from './add-kahoot-to-favorites.command';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { Inject } from '@nestjs/common';
import { Optional } from 'src/core/types/optional';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';

@CommandHandler(AddKahootToFavoritesCommand)
export class AddKahootToFavoritesHandler
  implements ICommandHandler<AddKahootToFavoritesCommand>
{
  constructor(
    @Inject(RepositoryName.User) private readonly userRepo: IUserRepository,
  ) {}

  async execute(query: AddKahootToFavoritesCommand): Promise<Optional<Error>> {
    try {
      // construir kahoot y user id con logica de dominio
      const userUUID: UserId = new UserId(query.userId);
      const kahootUUID: KahootId = new KahootId(query.kahootId);
      // hidratamos el objeto de dominio
      const user = await this.userRepo.findUserById(userUUID);
      if (!user) return new Optional<Error>(new Error('User not found'));
      // añadimos el kahoot
      user?.addFavorite(kahootUUID);
      // guardamos el usuario
      await this.userRepo.save(user);
      // retornamos optional sin errores
      return new Optional<Error>();
    } catch (err: any) {
      return new Optional<Error>(err);
    }
  }
}
