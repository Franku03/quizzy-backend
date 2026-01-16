/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\subscription\application\commands\upgrade-to-premium\upgrade-to-premium.handler.ts

import { Inject } from '@nestjs/common';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { UpgradeToPremiumCommand } from './upgrade-to-premium.command';
import { SubscriptionReadModel } from '../../queries/read-models/subscription.read.model';

import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { SubscriptionPlan } from 'src/users/domain/value-objects/user.subscription-plan';

import { Either, ErrorData } from 'src/core/types';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';

@CommandHandler(UpgradeToPremiumCommand)
export class UpgradeToPremiumHandler implements ICommandHandler<UpgradeToPremiumCommand> {
  
  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepository: IUserRepository,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(command: UpgradeToPremiumCommand): Promise<Either<ErrorData, SubscriptionReadModel>> {
    const userIdVO = new UserId(command.userId);

    const errorContext = createDomainContext('User', 'upgradeToPremium', {
      userId: command.userId,
    });

    const userOptional = await this.userRepository.findById(userIdVO);
    if (!userOptional.hasValue()) {
      return Either.makeLeft(
        DomainErrorFactory.notFound(errorContext, 'USER_NOT_FOUND')
      );
    }
    const user = userOptional.getValue();

    user.changeSubscription(SubscriptionPlan.MONTHLY_PREMIUM);

    await this.userRepository.save(user);

    const subStatus = user.subscriptionStatus;
    
    const response = new SubscriptionReadModel(
      user.id.value,
      'PREMIUM',
      subStatus.state,
      subStatus.expiresAt.value
    );

    return Either.makeRight(response);
  }
}