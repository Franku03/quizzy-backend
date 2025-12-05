// Esto es un commandHandler. Recibe el Command y usa
// una o varias implementaciones de nuestros ports (repositorios)
// para cargar agregados y manejar operaciones transacccionales
// Tambien pueden darle un event bus como parámetro (se debe cargar)
// como un provider de nest para que las dependencias se resuelvan
// correctamente, OJO CON ESO (y el event bus debe ser inyectable)

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateUserCommand } from './create-user.command';

import { User } from 'src/users/domain/aggregates/user';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { UserProfileDetails } from 'src/users/domain/value-objects/user.profile-details';
import { PlainPassword } from 'src/users/domain/value-objects/user.plain-password';
import { UserType } from 'src/users/domain/value-objects/user.type';
import { UserSubscriptionStatus } from 'src/users/domain/value-objects/user.user-subscription-status';
import { SubscriptionState } from 'src/users/domain/value-objects/user.subscription-state';
import { SubscriptionPlan } from 'src/users/domain/value-objects/user.subscription-plan';
import { DateISO } from 'src/core/domain/shared-value-objects/value-objects/value.object.date';

import type { IUuidGenerationService } from 'src/users/domain/domain-services/i.uuid-generator.interface';
import type { IPasswordHasher } from 'src/users/domain/domain-services/i.password-hasher.interface';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Either } from 'src/core/types/either';

import { CREATE_USER_ERROR_CODES } from './create-user.errors';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  
  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepository: IUserRepository,

    @Inject('IUuidGenerationService')
    private readonly uuidService: IUuidGenerationService,

    @Inject('IPasswordHasher')
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(command: CreateUserCommand): Promise<Either<Error, string>> {
    
    const emailVO = new UserEmail(command.email);
    const usernameVO = new UserName(command.username);

    const emailExists = await this.userRepository.existsUserByEmail(emailVO);
    if (emailExists) {
      return Either.makeLeft(new Error(CREATE_USER_ERROR_CODES.USER_EMAIL_ALREADY_EXISTS));
    }

    const usernameExists = await this.userRepository.existsUserByUsername(usernameVO);
    if (usernameExists) {
        return Either.makeLeft(new Error(CREATE_USER_ERROR_CODES.USER_USERNAME_ALREADY_EXISTS));
    }

    const uuid = this.uuidService.generateIUserId();
    const userId = new UserId(uuid);

    const plainPassword = new PlainPassword(command.password);
    const hashedPassword = await plainPassword.hash(this.hasher);

  
    const profile = new UserProfileDetails(command.username, '¡Hola! Soy nuevo en Quizzy.', '');
    
    const date = '2099-12-31'; 
    const subscription = new UserSubscriptionStatus(
        SubscriptionState.ACTIVE,
        SubscriptionPlan.FREE,
        DateISO.createFrom(date)
    );

    const user = User.create(
        userId,
        emailVO,
        usernameVO,
        profile,
        hashedPassword,
        UserType.STUDENT,
        subscription
    );

    await this.userRepository.save(user);

    return Either.makeRight(uuid);
  }
}