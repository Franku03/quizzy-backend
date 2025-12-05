import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ChangeUsernameCommand } from './change-username.command';
import { Either } from 'src/core/types/either';

import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

import { UserNotFoundError } from 'src/users/domain/errors/user-not-found.error';
import { CHANGE_USERNAME_ERRORS } from './change-username.errors';

@CommandHandler(ChangeUsernameCommand)
export class ChangeUsernameHandler implements ICommandHandler<ChangeUsernameCommand> {
    
    constructor(
        @Inject(RepositoryName.User)
        private readonly userRepo: IUserRepository,
    ) {}

    async execute(command: ChangeUsernameCommand): Promise<Either<Error, void>> {
        const userId = new UserId(command.userId);
        const newUsername = new UserName(command.newUsername);

        const user = await this.userRepo.findUserById(userId);
        if (!user) {
            return Either.makeLeft(new UserNotFoundError(command.userId));
        }

        const isTaken = await this.userRepo.existsUserByUsername(newUsername);
        if (isTaken) {
            return Either.makeLeft(new Error(CHANGE_USERNAME_ERRORS.USERNAME_ALREADY_TAKEN));
        }

        try {
            user.changeUserName(newUsername);
            
            await this.userRepo.save(user);
            
            return Either.makeRight(undefined);

        } catch (error) {
            return Either.makeLeft(error); 
        }
    }
}