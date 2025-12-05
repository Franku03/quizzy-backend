import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteUserCommand } from './delete-user.command';
import { Either } from 'src/core/types/either';

import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserNotFoundError } from 'src/users/domain/errors/user-not-found.error';

import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  
  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(command: DeleteUserCommand): Promise<Either<UserNotFoundError, void>> {
    const userId = new UserId(command.userId);

    const user = await this.userRepo.findUserById(userId);
    if (!user) {
      return Either.makeLeft(new UserNotFoundError(command.userId));
    }

    await this.userRepo.deleteUser(userId);

    return Either.makeRight(undefined);
  }
}