import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { Inject } from '@nestjs/common';
import { ChangeUsernameCommand } from './change-username.command';
import { Either } from 'src/core/types/either';
import { ErrorData, ErrorLayer } from 'src/core/types';

import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { CHANGE_USERNAME_ERRORS } from './change-username.errors';

@CommandHandler(ChangeUsernameCommand)
export class ChangeUsernameHandler implements ICommandHandler<ChangeUsernameCommand> {
    
    constructor(
        @Inject(RepositoryName.User)
        private readonly userRepo: IUserRepository,
    ) {}

    async execute(command: ChangeUsernameCommand): Promise<Either<ErrorData, void>> {
        const userId = new UserId(command.userId);
        const newUsername = new UserName(command.newUsername);

        const userOptional = await this.userRepo.findById(userId);

        if (!userOptional.hasValue()) {
            return Either.makeLeft(
                new ErrorData('RESOURCE_NOT_FOUND', `User ${command.userId} not found`, ErrorLayer.DOMAIN)
            );
        }
        
        const user = userOptional.getValue();
        
        const isTaken = await this.userRepo.existsUserByUsername(newUsername);
        if (isTaken) {
            return Either.makeLeft(
                new ErrorData('CONFLICT', CHANGE_USERNAME_ERRORS.USERNAME_ALREADY_TAKEN, ErrorLayer.DOMAIN)
            );
        }

        try {
            user.changeUserName(newUsername);
            await this.userRepo.save(user);
            return Either.makeRight(undefined);

        } catch (error) {
            return Either.makeLeft(
                new ErrorData('VALIDATION_FAILED', error.message, ErrorLayer.DOMAIN)
            );
        }
    }
}