import { IQueryHandler } from "src/core/application/cqrs/query-handler.interface";
import { QueryHandler } from "src/core/infrastructure/cqrs/decorators/query-handler.decorator";
import { GetKahootLeaderboardQuery } from "./get-kahoot-leaderboard.query";
import { Inject } from "@nestjs/common";
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";
import type { IGroupsDao } from "../ports/groups.dao.port";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { GROUP_ERRORS } from "src/groups/application/commands/group.errors";
import { KahootLeaderboardReadModel } from "../read-model/kahoot.leaderboard.model";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { LOGGER_TOKEN } from 'src/core/application/aspects/logging/logger.token';

@QueryHandler(GetKahootLeaderboardQuery)
export class GetKahootLeaderboardHandler implements IQueryHandler<GetKahootLeaderboardQuery> {
    private readonly useCase: string = 'User retrieves the leaderboard of a specific kahoot in a group';
    constructor(
        @Inject(DaoName.Group) private readonly groupsQueryDao: IGroupsDao,
        @Inject(RepositoryName.Group) private readonly groupRepository: IGroupRepository,
        @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
    ) { }

    @Log()
    async execute(query: GetKahootLeaderboardQuery): Promise<Either<ErrorData, KahootLeaderboardReadModel>> {
        const errorContext = createDomainContext('Group', 'getKahootLeaderboard', {
            domainObjectId: query.groupId,
            actorId: query.userId,
            userId: query.userId,
            intendedAction: 'read',
            quizId: query.quizId,
        });

        try {
            const groupOptional = await this.groupRepository.findById(query.groupId);
            if (!groupOptional.hasValue()) {
                return Either.makeLeft(DomainErrorFactory.notFound(errorContext, GROUP_ERRORS.NOT_FOUND));
            }
            const group = groupOptional.getValue();

            const userId = new UserId(query.userId);
            if (!group.isMember(userId)) {
                return Either.makeLeft(DomainErrorFactory.unauthorized(errorContext, GROUP_ERRORS.NOT_MEMBER));
            }

            const leaderboardOptional = await this.groupsQueryDao.getKahootLeaderboard(query.groupId, query.quizId);
            if (!leaderboardOptional.hasValue()) {
                return Either.makeRight(new KahootLeaderboardReadModel(query.quizId, query.groupId, []));
            }
            return Either.makeRight(leaderboardOptional.getValue());
        } catch (error) {
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during get kahoot leaderboard: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );
            return Either.makeLeft(unexpectedError);
        }
    }
}
