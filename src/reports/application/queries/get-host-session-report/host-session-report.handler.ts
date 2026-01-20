import { Inject } from "@nestjs/common";
import { IQueryHandler } from "src/core/application/cqrs";
import { QueryHandler } from "src/core/infrastructure/cqrs";
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";
import { GetDetailedHostReportQuery } from "./host-session-report.query";

import { Authorize } from "src/core/application/aspects/auth/authorization.decorator";
import { SessionHostAuthorizer } from "src/core/application/aspects/auth/strategies/sessionHostOwnership.strategy";
import { Log } from "src/core/application/aspects/logging/log.decorator";

import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import type { IMultiplayerSessionDao } from "src/reports/application/ports/i-multiplayer-session.dao.interface";
import { Either, ErrorData } from "src/core/types";
import { HostSessionDetailsReadModel } from "src/reports/application/queries/read-models/host.session.details.read.model";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";

@QueryHandler(GetDetailedHostReportQuery)

export class GetDetailedHostReportHandler implements IQueryHandler<GetDetailedHostReportQuery> {

  constructor(
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
    @Inject(DaoName.MultiplayerSession) private readonly sessionDao: IMultiplayerSessionDao,
  ) { }

  @Log()
  @Authorize( SessionHostAuthorizer, 'sessionDao')
  async execute(
    query: GetDetailedHostReportQuery 
  ): Promise<Either<ErrorData, HostSessionDetailsReadModel>> {

    return pipeAsync<ErrorData, HostSessionDetailsReadModel>(

      Either.makeRight( query ),

      either => either.chainAsync(async ( query: GetDetailedHostReportQuery  ) => {
        const result = await this.sessionDao.getHostDetailsById( query.sessionId, query.userId );
        return result;
      })

    );
  }

}