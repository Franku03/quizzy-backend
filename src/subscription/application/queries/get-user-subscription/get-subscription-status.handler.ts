/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\subscription\application\queries\get-user-subscription\get-subscription-status.handler.ts

import { Inject } from '@nestjs/common';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { GetSubscriptionStatusQuery } from './get-subscription-status.query';
import { SubscriptionReadModel } from '../read-models/subscription.read.model';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Either, ErrorData } from 'src/core/types';

import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@QueryHandler(GetSubscriptionStatusQuery)
export class GetSubscriptionStatusHandler implements IQueryHandler<GetSubscriptionStatusQuery> {
  
  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepository: IUserRepository,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
    private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(query: GetSubscriptionStatusQuery): Promise<Either<ErrorData, SubscriptionReadModel>> {
    const userIdVO = new UserId(query.userId);

    const errorContext = createDomainContext('User', 'getSubscriptionStatus', {
        domainObjectId: query.userId,
    });

    const userOptional = await this.userRepository.findById(userIdVO);

    if (!userOptional.hasValue()) {
      return Either.makeLeft(
        DomainErrorFactory.notFound(
            errorContext,
            'NOT_FOUND',
        )
      );
    }

    const user = userOptional.getValue();
    
    const subStatus = user.subscriptionStatus;
    const planDisplay = subStatus.plan;
    const statusDisplay = subStatus.state;
    
    let expiresAt: string | null = subStatus.expiresAt.value;
    if (expiresAt.includes('2099')) { 
        expiresAt = null;
    }

    const response = new SubscriptionReadModel(
      user.id.value,
      planDisplay,
      statusDisplay,
      expiresAt
    );

    return Either.makeRight(response);
  }
}