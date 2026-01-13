/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\application\aspects\auth\strategies\groupAdmin.strategy.ts

import { IAuthorizer } from '../authorizer.interface';
import { GROUP_ERRORS } from 'src/groups/application/commands/group.errors';
import { IGroupsDao } from 'src/groups/application/queries/ports/groups.dao.port';
import { Either, ErrorData } from 'src/core/types';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';

export interface IRequestWithGroupAndUser {
  groupId: string;
  userId?: string;
  adminId?: string;
  operationName?: string;
}

export class GroupAdminAuthorizer implements IAuthorizer<IRequestWithGroupAndUser, IGroupsDao> {
  async authorize(request: IRequestWithGroupAndUser, context: IGroupsDao): Promise<Either<ErrorData, void>> {
    const groupId = request.groupId;
    const userId = request.userId || request.adminId;

    const errorContext = createDomainContext('Group', request.operationName || 'authorize', {
      domainObjectId: groupId,
      actorId: userId,
      userId: userId,
    });

    if (!userId) {
      return Either.makeLeft(
        DomainErrorFactory.unauthorized(errorContext, GROUP_ERRORS.NOT_ADMIN)
      );
    }

    const isAdmin = await context.isGroupAdmin(groupId, userId);

    if (!isAdmin) {
      return Either.makeLeft(
        DomainErrorFactory.unauthorized(errorContext, GROUP_ERRORS.NOT_ADMIN)
      );
    }

    return Either.makeRight(undefined);
  }
}

