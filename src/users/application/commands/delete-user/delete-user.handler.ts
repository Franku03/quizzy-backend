/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\commands\delete-user\delete-user.handler.ts

import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { Inject } from '@nestjs/common';
import { DeleteUserCommand } from './delete-user.command';
import { Either } from 'src/core/types/either';

import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';

import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { ErrorData, ErrorLayer } from 'src/core/types';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  
  constructor(@Inject(RepositoryName.User) private readonly userRepo: IUserRepository) {}

  async execute(command: DeleteUserCommand): Promise<Either<ErrorData, void>> {
    const userId = new UserId(command.userId);
    const userOptional = await this.userRepo.findById(userId);

    if (!userOptional.hasValue()) {
      return Either.makeLeft(
         new ErrorData('RESOURCE_NOT_FOUND', `User ${command.userId} not found`, ErrorLayer.DOMAIN)
      );
    }

    await this.userRepo.deleteUser(userId);
    return Either.makeRight(undefined);
  }
}