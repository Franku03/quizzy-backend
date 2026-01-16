/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\commands\register-user\register-user.handler.ts

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
import { Either, ErrorData } from 'src/core/types';
import { REGISTER_USER_ERROR_CODES } from './register-user.errors';
import { UserType } from 'src/users/domain/value-objects/user.type';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';

import { RegisterUserResponseDto } from 'src/users/infrastructure/nest-js/response-dtos/user.response.dto';

import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  private readonly useCase: string = 'User registers a new account';

  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepository: IUserRepository,
    @Inject('IUuidGenerationService')
    private readonly uuidService: IUuidGenerationService,
    @Inject('IPasswordHasher')
    private readonly hasher: IPasswordHasher,
    private readonly mediaEnrichmentService: MediaEnrichmentService,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
    private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(command: RegisterUserCommand): Promise<Either<ErrorData, RegisterUserResponseDto>> {
    const uuid = this.uuidService.generateIUserId();
    const userId = new UserId(uuid);

    const errorContext = createDomainContext('User', 'registerUser', {
        domainObjectId: uuid,
        email: command.email,
        username: command.username
    });

    const emailVO = new UserEmail(command.email);
    if (await this.userRepository.existsUserByEmail(emailVO)) {
      return Either.makeLeft(
        DomainErrorFactory.conflict(
            errorContext,
            'DUPLICATE',
            REGISTER_USER_ERROR_CODES.USER_EMAIL_ALREADY_EXISTS
        )
      );
    }

    const usernameVO = new UserName(command.username);
    if (await this.userRepository.existsUserByUsername(usernameVO)) {
        return Either.makeLeft(
            DomainErrorFactory.conflict(
                errorContext,
                'DUPLICATE',
                REGISTER_USER_ERROR_CODES.USER_USERNAME_ALREADY_EXISTS
            )
        );
    }

    const plainPassword = new PlainPassword(command.password);
    const hashedPassword = await plainPassword.hash(this.hasher);
    const profile = new UserProfileDetails(command.name, '¡Hola! Soy nuevo en Quizzy.', '');
    
    const infiniteDate = '2099-12-31'; 
    const subscription = new UserSubscriptionStatus(
        SubscriptionState.ACTIVE,
        SubscriptionPlan.FREE,
        DateISO.createFrom(infiniteDate)
    );

    const user = User.create(
        userId,
        emailVO,
        usernameVO,
        profile,
        hashedPassword,
        command.type as UserType,
        subscription
    );

    await this.userRepository.save(user);

    const responseDto = RegisterUserResponseDto.fromDomain(user);

    const enrichDto = await this.mediaEnrichmentService.enrich(responseDto);

    return Either.makeRight(enrichDto);
  }
}