import { Inject } from "@nestjs/common";
import { IQueryHandler } from "src/core/application/cqrs";
import { QueryHandler } from "src/core/infrastructure/cqrs";
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";
import { GetDetailedPlayerReportQuery } from "./player-session-report.query";
import { PlayerSessionDetailsReadModel } from "../read-models/player.session.details.read.model";

import type { IMultiplayerSessionDao } from "src/reports/application/ports/i-multiplayer-session.dao.interface";
import { Authorize } from "src/core/application/aspects/auth/authorization.decorator";
import { SessionPlayerAuthorizer } from "src/core/application/aspects/auth/strategies/sessionPlayerOwnership.strategy";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";

import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";
import { Either, ErrorData } from "src/core/types";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";

@QueryHandler(GetDetailedPlayerReportQuery)
export class GetDetailedPlayerReportHandler implements IQueryHandler<GetDetailedPlayerReportQuery> {

  constructor(
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
    @Inject(DaoName.MultiplayerSession) private readonly sessionDao: IMultiplayerSessionDao,
    private readonly mediaService: MediaEnrichmentService,
  ) { }

  @Log()
  @Authorize( SessionPlayerAuthorizer, 'sessionDao')
  async execute(
    query: GetDetailedPlayerReportQuery
  ): Promise<Either<ErrorData, PlayerSessionDetailsReadModel>> {

    return pipeAsync<ErrorData, PlayerSessionDetailsReadModel>(

      Either.makeRight( query ),

      either => either.chainAsync(async ( query: GetDetailedPlayerReportQuery  ) => {
        const result = await this.sessionDao.getPlayerDetailsById( query.sessionId, query.userId );
        return result;
      }),

      result => result.mapAsync( async ( result: PlayerSessionDetailsReadModel) => {

        if( !result ) return null;

        const enrichedRes = await this.mediaService.enrich( result );
        return enrichedRes;

      })

    );
  }

}