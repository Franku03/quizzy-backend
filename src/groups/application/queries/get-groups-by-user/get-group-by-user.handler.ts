/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\queries\get-groups-by-user\get-group-by-user.handler.ts

import type { IGroupsDao } from '../ports/groups.dao.port';
import { GetGroupsByUserQuery } from './get-group-by-user.query';
import { GroupReadModel } from '../read-model/group.read.model';
import { Inject } from '@nestjs/common';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { GROUP_ERRORS } from '../../commands/group.errors';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';


@QueryHandler(GetGroupsByUserQuery)
export class GetGroupsByUserHandler implements IQueryHandler<GetGroupsByUserQuery> {
    private readonly useCase: string = 'User retrieves the list of groups they belong to';
    constructor(
        @Inject(DaoName.Group) private readonly groupsQueryDao: IGroupsDao,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
    ) { }

    @Log()
    async execute(query: GetGroupsByUserQuery): Promise<Either<ErrorData, GroupReadModel[]>> {
        const errorContext = createDomainContext('Group', 'getGroupsByUser', {
            userId: query.userId,
            actorId: query.userId,
        });

        try {
            const groupsOptional = await this.groupsQueryDao.getGroupsByUserId(query.userId);
            if (!groupsOptional.hasValue()) {
                return Either.makeRight([]);
            }
            return Either.makeRight(groupsOptional.getValue());
        } catch (error) {
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during get groups by user: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );

            return Either.makeLeft(unexpectedError);
        }
    }
}