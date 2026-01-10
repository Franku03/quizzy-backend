import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { Inject } from '@nestjs/common';
import { RegisterUserCommand } from './register-user.command';
import { User } from 'src/users/domain/aggregates/user';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { UserProfileDetails } from 'src/users/domain/value-objects/user.profile-details';
import { PlainPassword } from 'src/users/domain/value-objects/user.plain-password';
import { UserSubscriptionStatus } from 'src/users/domain/value-objects/user.user-subscription-status';
import { SubscriptionState } from 'src/users/domain/value-objects/user.subscription-state';
import { SubscriptionPlan } from 'src/users/domain/value-objects/user.subscription-plan';
import { DateISO } from 'src/core/domain/shared-value-objects/value-objects/value.object.date';
import type { IUuidGenerationService } from 'src/users/domain/domain-services/i.uuid-generator.interface';
import type { IPasswordHasher } from 'src/users/domain/domain-services/i.password-hasher.interface';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Either } from 'src/core/types/either';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { REGISTER_USER_ERROR_CODES } from './register-user.errors';
import { UserType } from 'src/users/domain/value-objects/user.type';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { UserProfileReadModel } from '../../queries/read-model/get-user-profile.model';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  
  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepository: IUserRepository,
    @Inject('IUuidGenerationService')
    private readonly uuidService: IUuidGenerationService,
    @Inject('IPasswordHasher')
    private readonly hasher: IPasswordHasher,
    private readonly mediaEnrichmentService: MediaEnrichmentService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<Either<ErrorData, UserProfileReadModel>> {
    const emailVO = new UserEmail(command.email);
    const usernameVO = new UserName(command.username);

    const emailExists = await this.userRepository.existsUserByEmail(emailVO);
    if (emailExists) {
      return Either.makeLeft(new ErrorData('CONFLICT', REGISTER_USER_ERROR_CODES.USER_EMAIL_ALREADY_EXISTS, ErrorLayer.DOMAIN));
    }

    const usernameExists = await this.userRepository.existsUserByUsername(usernameVO);
    if (usernameExists) {
        return Either.makeLeft(new ErrorData('CONFLICT', REGISTER_USER_ERROR_CODES.USER_USERNAME_ALREADY_EXISTS, ErrorLayer.DOMAIN));
    }

    const uuid = this.uuidService.generateIUserId();
    const userId = new UserId(uuid);
    
    const plainPassword = new PlainPassword(command.password);
    const hashedPassword = await plainPassword.hash(this.hasher);

    const profile = new UserProfileDetails(command.name, '¡Hola! Soy nuevo en Quizzy.', '');
    
    const date = '2099-12-31'; 
    const subscription = new UserSubscriptionStatus(SubscriptionState.ACTIVE, SubscriptionPlan.FREE, DateISO.createFrom(date));

    const user = User.create(
        userId, emailVO, usernameVO, profile, hashedPassword, command.type as UserType, subscription
    );

    await this.userRepository.save(user);

    const readModel = new UserProfileReadModel(
        user.id.value, user.email.value, user.username.value, user.type,
        user.state, user.roles, user.isAdmin(),
        { theme: user.userPreferences.themePreference },
        { name: user.userProfileDetails.name, description: user.userProfileDetails.description, avatarAssetId: user.userProfileDetails.avatarAssetId }
    );

    await this.mediaEnrichmentService.enrich(readModel);

    return Either.makeRight(readModel);
  }
}