import { Inject } from "@nestjs/common";
import { IQueryHandler } from "src/core/application/cqrs";
import { QueryHandler } from "src/core/infrastructure/cqrs";
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";

import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { Log } from "src/core/application/aspects/logging/log.decorator";

import type { IMultiplayerSessionDao } from "src/reports/application/ports/i-multiplayer-session.dao.interface";
import { GetPlayedKahootListQuery } from "./played-kahoot-list.query";
import { UserGameReportDetails } from "../read-models/user.report.detailts.read.model";

import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";
import { Either, ErrorData } from "src/core/types";

@QueryHandler(GetPlayedKahootListQuery)
export class GetPlayedKahootListHandler implements IQueryHandler<GetPlayedKahootListQuery> {

  constructor(
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
    @Inject(DaoName.MultiplayerSession) private readonly sessionDao: IMultiplayerSessionDao,
  ) { }

  @Log()
  async execute(
    query: GetPlayedKahootListQuery
  ): Promise<Either<ErrorData, UserGameReportDetails | null >> {


    const result = this.sessionDao.getUserSessionDetailsById( query.userId, query.limit, query.page );

    // Llamar al otro Dao, se me ocurre que cada dao llame a la mitad del limite para compensar, es decir limit 5 para el primero y luego limit 5 para el siguiente
    // Luego organizamos por fecha y listo (tbh casi pareciera que vale más la pena hacer un DAO único para el modulo de reportes, tipo para gestionar)
    // Estas consultas de solo-attempts + multiplayer-sessions

    return result;

  }

}