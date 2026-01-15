import { IAuthorizer } from '../authorizer.interface';
import { GROUP_ERRORS } from 'src/groups/application/commands/group.errors';
import { IGroupsDao } from 'src/groups/application/queries/ports/groups.dao.port';
import { Either, ErrorData } from 'src/core/types';

import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { IMultiplayerSessionDao } from 'src/reports/application/ports/i-multiplayer-session.dao.interface';
import { createApplicationContext } from 'src/core/errors/helpers/app-error-context.helper';
import { AppErrorFactory } from 'src/core/errors/factories/app-error.factory';

export interface IRequestWithUserAsHost {
  sessionId: string;
  userId: string;
}

export class SessionHostAuthorizer implements IAuthorizer<
  IRequestWithUserAsHost,
  IMultiplayerSessionDao
> {
  async authorize(
    request: IRequestWithUserAsHost,
    context: IMultiplayerSessionDao,
  ): Promise<Either<ErrorData, void>> {
    const userId = request.userId;
    const sessionId = request.sessionId;

    const errorContext = createApplicationContext('getDetailedHostReport', {
      actorId: userId,
      resourceTargetId: sessionId,
    });

    if (!userId) {
      return Either.makeLeft(AppErrorFactory.unauthorized(errorContext));
    }

    const isAdminResult = await context.isUserSessionHost(userId, sessionId);

    if (isAdminResult.isLeft()) return Either.makeLeft(isAdminResult.getLeft());

    if (!isAdminResult.getRight()) {
      return Either.makeLeft(AppErrorFactory.unauthorized(errorContext));
    }

    return Either.makeRight(undefined);
  }
}
