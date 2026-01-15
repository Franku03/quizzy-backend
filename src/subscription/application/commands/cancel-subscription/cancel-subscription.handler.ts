import { Inject } from '@nestjs/common';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { CancelSubscriptionCommand } from './cancel-subscription.command';
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

@CommandHandler(CancelSubscriptionCommand)
export class CancelSubscriptionHandler implements ICommandHandler<CancelSubscriptionCommand> {
  
  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepository: IUserRepository,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(command: CancelSubscriptionCommand): Promise<Either<ErrorData, SubscriptionReadModel>> {
    const userIdVO = new UserId(command.userId);

    const errorContext = createDomainContext('User', 'cancelSubscription', {
      userId: command.userId,
    });

    const userOptional = await this.userRepository.findById(userIdVO);
    if (!userOptional.hasValue()) {
      return Either.makeLeft(
        DomainErrorFactory.notFound(errorContext, 'USER_NOT_FOUND')
      );
    }
    const user = userOptional.getValue();

    user.changeSubscription(SubscriptionPlan.FREE);

    await this.userRepository.save(user);

    const subStatus = user.subscriptionStatus;

    const response = new SubscriptionReadModel(
      user.id.value,
      'FREE',
      subStatus.state,
      null
    );

    return Either.makeRight(response);
  }
}