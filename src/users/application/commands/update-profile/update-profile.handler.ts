import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { Inject } from '@nestjs/common';
import { UpdateProfileCommand } from './update-profile.command';
import { Either } from 'src/core/types/either';
import { ErrorData } from 'src/core/types';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { UserProfileDetails } from 'src/users/domain/value-objects/user.profile-details';
import { UserPreferences } from 'src/users/domain/value-objects/user.user-preferences';
import { PlainPassword } from 'src/users/domain/value-objects/user.plain-password';
import type { IPasswordHasher } from 'src/users/domain/domain-services/i.password-hasher.interface';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { UserOwnershipAuthorizer } from 'src/core/application/aspects/auth/strategies/userOwnership.strategy';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';

import { UpdateProfileResponseDto } from 'src/users/infrastructure/nest-js/response-dtos/update-user.response.dto';
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  private readonly useCase: string = 'User updates their profile';

  constructor(
    @Inject(RepositoryName.User)
    public readonly userRepo: IUserRepository,
    @Inject('IPasswordHasher')
    private readonly hasher: IPasswordHasher,
    private readonly mediaEnrichmentService: MediaEnrichmentService,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
    private readonly logger: ILogger,
  ) {}

  @Authorize(UserOwnershipAuthorizer, 'userRepo')
  @Log()
  async execute(command: UpdateProfileCommand): Promise<Either<ErrorData, UpdateProfileResponseDto>> {
    const errorContext = createDomainContext('User', 'updateProfile', {
        domainObjectId: command.userId,
        actorId: command.userId
    });

    const userId = new UserId(command.userId);
    const userOptional = await this.userRepo.findById(userId);

    if (!userOptional.hasValue()) {
       return Either.makeLeft(DomainErrorFactory.notFound(errorContext, 'User not found'));
    }

    const user = userOptional.getValue();

      if (command.username && command.username !== user.username.value) {
          const newUsernameVO = new UserName(command.username);
          if (await this.userRepo.existsUserByUsername(newUsernameVO)) {
              return Either.makeLeft(DomainErrorFactory.conflict(errorContext, 'DUPLICATE', 'Username already exists'));
          }

          try {
            user.changeUserName(newUsernameVO);
        } catch (invariantError) {
            return Either.makeLeft(
                DomainErrorFactory.validation(
                    errorContext,
                    { username: [invariantError.message] },
                    'Username update failed'
                )
            );
        }
      }

      if (command.email && command.email !== user.email.value) {
          const newEmailVO = new UserEmail(command.email);
          if (await this.userRepo.existsUserByEmail(newEmailVO)) {
              return Either.makeLeft(DomainErrorFactory.conflict(errorContext, 'DUPLICATE', 'Email already exists'));
          }
          user.changeEmail(newEmailVO);
      }

      const currentDetails = user.userProfileDetails;
      const newName = command.name ?? currentDetails.name;
      const newDesc = command.description ?? currentDetails.description;
      const newAvatar = command.avatarAssetId ?? currentDetails.avatarAssetId;

      if (newName !== currentDetails.name || newDesc !== currentDetails.description || newAvatar !== currentDetails.avatarAssetId) {
          const newProfileDetails = new UserProfileDetails(newName, newDesc, newAvatar);
          user.changeProfileDetails(newProfileDetails);
      }

      if (command.newPassword) {
        if (!command.currentPassword) {
            return Either.makeLeft(DomainErrorFactory.validation(errorContext, { password: ['Current password is required'] }));
        }
        try {
            const currentPlain = new PlainPassword(command.currentPassword);
            const newPlain = new PlainPassword(command.newPassword);
            await user.changePassword(currentPlain, newPlain, this.hasher);
        } catch (error) {
            return Either.makeLeft(DomainErrorFactory.validation(errorContext, { password: [error.message] }));
        }
      }

      if (command.themePreference) {
          const newPrefs = UserPreferences.create(command.themePreference);
          user.changeUserPreferences(newPrefs);
      }

      user.isUserPremium();

      await this.userRepo.save(user);
      
      const responseDto = UpdateProfileResponseDto.fromDomain(user);

      const enrichDto = await this.mediaEnrichmentService.enrich(responseDto);
      
      return Either.makeRight(enrichDto);
  }
}