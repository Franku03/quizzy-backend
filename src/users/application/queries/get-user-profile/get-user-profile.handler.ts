/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\queries\get-user-profile\get-user-profile.handler.ts

import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { Inject } from '@nestjs/common';
import { GetUserProfileQuery } from './get-user-profile.query';
import { Either, ErrorData } from 'src/core/types';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { UserOwnershipAuthorizer } from 'src/core/application/aspects/auth/strategies/userOwnership.strategy';

import { UserProfileReadModel } from '../read-model/get-user-profile.model';
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler implements IQueryHandler<GetUserProfileQuery> {
  
  constructor(
    @Inject(RepositoryName.User)
    public readonly userRepo: IUserRepository,
    private readonly mediaEnrichmentService: MediaEnrichmentService,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
    private readonly logger: ILogger,
  ) {}

  @Authorize(UserOwnershipAuthorizer, 'userRepo')
  @Log()
  async execute(query: GetUserProfileQuery): Promise<Either<ErrorData, UserProfileReadModel>> {
    const errorContext = createDomainContext('User', 'getUserProfile', {
        domainObjectId: query.userId,
        targetUserId: query.targetUserId
    });

    const userId = new UserId(query.userId);
    const userOptional = await this.userRepo.findById(userId);

    if (!userOptional.hasValue()) {
      return Either.makeLeft(
        DomainErrorFactory.notFound(
            errorContext,
            'User not found'
        )
      );
    }

    const user = userOptional.getValue();

    const readModel = UserProfileReadModel.fromDomain(user);

    const enrichReadModel = await this.mediaEnrichmentService.enrich(readModel);

    return Either.makeRight(enrichReadModel);
  }
}