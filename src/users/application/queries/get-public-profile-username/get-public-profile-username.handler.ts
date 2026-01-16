/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\queries\get-public-profile-username\get-public-profile-username.handler.ts

import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { Inject } from '@nestjs/common';
import { GetPublicProfileUsernameQuery } from './get-public-profile-username.query';
import { Either, ErrorData } from 'src/core/types';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';

import { PublicUserProfileReadModel } from '../read-model/get-public-profile.model';

import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@QueryHandler(GetPublicProfileUsernameQuery)
export class GetPublicProfileUsernameHandler implements IQueryHandler<GetPublicProfileUsernameQuery> {
  
  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepo: IUserRepository,
    private readonly mediaEnrichmentService: MediaEnrichmentService,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
    private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(query: GetPublicProfileUsernameQuery): Promise<Either<ErrorData, PublicUserProfileReadModel>> {
    const errorContext = createDomainContext('User', 'getPublicProfileByUsername', {
        username: query.username
    });

    const usernameVO = new UserName(query.username);
    const userOptional = await this.userRepo.findByUsername(usernameVO);

    if (!userOptional.hasValue()) {
      return Either.makeLeft(
        DomainErrorFactory.notFound(
            errorContext,
            `User with username "${query.username}" not found`
        )
      );
    }

    const user = userOptional.getValue();

    const readModel = PublicUserProfileReadModel.fromDomain(user);

    const enrichReadModel = await this.mediaEnrichmentService.enrich(readModel);

    return Either.makeRight(enrichReadModel);
  }
}