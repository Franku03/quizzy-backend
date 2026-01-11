import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { Inject } from '@nestjs/common';
import { UpdateProfileCommand } from './update-profile.command';
import { Either } from 'src/core/types/either';
import { ErrorData, ErrorLayer } from 'src/core/types';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { UserProfileDetails } from 'src/users/domain/value-objects/user.profile-details';
import { UserPreferences } from 'src/users/domain/value-objects/user.user-preferences';
import { UserProfileReadModel } from '../../queries/read-model/get-user-profile.model';
import { PlainPassword } from 'src/users/domain/value-objects/user.plain-password';
import type { IPasswordHasher } from 'src/users/domain/domain-services/i.password-hasher.interface';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { UserOwnershipAuthorizer } from 'src/core/application/aspects/auth/strategies/userOwnership.strategy';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  constructor(
    @Inject(RepositoryName.User)
    public readonly userRepo: IUserRepository,
    @Inject('IPasswordHasher')
    private readonly hasher: IPasswordHasher,
    private readonly mediaEnrichmentService: MediaEnrichmentService,
  ) {}

  @Authorize(UserOwnershipAuthorizer, 'userRepo')
  async execute(command: UpdateProfileCommand): Promise<Either<ErrorData, UserProfileReadModel>> {
    const userId = new UserId(command.userId);
    const userOptional = await this.userRepo.findById(userId);

    if (!userOptional.hasValue()) {
       return Either.makeLeft(new ErrorData('RESOURCE_NOT_FOUND', 'User not found', ErrorLayer.DOMAIN));
    }

    const user = userOptional.getValue();

      if (command.username && command.username !== user.username.value) {
          const newUsernameVO = new UserName(command.username);
          
          const exists = await this.userRepo.existsUserByUsername(newUsernameVO);
          if (exists) {
              return Either.makeLeft(new ErrorData('CONFLICT', 'USER_USERNAME_ALREADY_EXISTS', ErrorLayer.DOMAIN));
          }

          user.changeUserName(newUsernameVO);
      }

      if (command.email && command.email !== user.email.value) {
          const newEmailVO = new UserEmail(command.email);

          const exists = await this.userRepo.existsUserByEmail(newEmailVO);
          if (exists) {
              return Either.makeLeft(new ErrorData('CONFLICT', 'USER_EMAIL_ALREADY_EXISTS', ErrorLayer.DOMAIN));
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
            return Either.makeLeft(new ErrorData('VALIDATION_FAILED', 'Current password is required', ErrorLayer.DOMAIN));
        }

        const currentPlain = new PlainPassword(command.currentPassword);
        const newPlain = new PlainPassword(command.newPassword);

        await user.changePassword(currentPlain, newPlain, this.hasher);
      }

      if (command.themePreference) {
          const newPrefs = UserPreferences.create(command.themePreference);
          user.changeUserPreferences(newPrefs);
      }

      await this.userRepo.save(user);

      const readModel = new UserProfileReadModel(
        user.id.value, user.email.value, user.username.value, user.type,
        user.state, user.roles, user.isAdmin(),
        { theme: user.userPreferences.themePreference },
        { name: user.userProfileDetails.name, description: user.userProfileDetails.description, avatarAssetUrl: user.userProfileDetails.avatarAssetId },
        user.isUserPremium(),
    );
      
    await this.mediaEnrichmentService.enrich(readModel);
    
    return Either.makeRight(readModel);

  }
}