/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\queries\get-all-users\get-all-users.handler.ts

import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { Inject } from '@nestjs/common';
import { GetAllUsersQuery } from './get-all-users.query';
import { GetAllUsersModel } from '../read-model/get-all-users.model';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';

import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@QueryHandler(GetAllUsersQuery)
export class GetAllUsersHandler implements IQueryHandler<GetAllUsersQuery> {
  private readonly useCase: string = 'Get all users directory';

  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepository: IUserRepository,
    private readonly mediaEnrichmentService: MediaEnrichmentService,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
    private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(query: GetAllUsersQuery): Promise<Either<ErrorData, GetAllUsersModel[]>> {
    const errorContext = createDomainContext('User', 'getAllUsers', {
        operation: 'Directory listing'
    });

    try {
        const users = await this.userRepository.findAll();

        const validModels: GetAllUsersModel[] = [];

        for (const user of users) {
 
            if (!user.id || !user.email || !user.username || !user.userProfileDetails) {
                this.logger.log(`Skipping corrupt or incomplete user record (ID: ${user.id?.value || 'unknown'}).`);
                continue;
            }

            try {
                const model = GetAllUsersModel.fromDomain(user);
                validModels.push(model);
            } catch (mappingError) {
                this.logger.error(`Error mapping user ${user.id.value} to read model: ${mappingError.message}`);
            }
        }

        const enrichModels = await Promise.all(validModels.map(model => this.mediaEnrichmentService.enrich(model)));

        return Either.makeRight(enrichModels);

    } catch (error) {
   
        return Either.makeLeft(
            new ErrorData(
                'INTERNAL_ERROR', 
                `Failed to retrieve users directory: ${error instanceof Error ? error.message : String(error)}`, 
                ErrorLayer.INFRASTRUCTURE,
                errorContext
            )
        );
    }
  }
}