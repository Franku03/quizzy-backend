import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ERROR_TOKENS } from "src/core/errors/dependecy-tokens/application-core-erros.tokens";

import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";
import { DaoMongo } from "../../decorators/dao-mongo.decorator";
import { IMultiplayerSessionDao } from "src/reports/application/ports/i-multiplayer-session.dao.interface";
import { MULTIPLAYER_SESSIONS_MONGO_BASE } from "./constants/multiplayer-session.mongo-constants";

import { MultiplayerSessionMongoMapper } from "./mappers/session.mongo.mapper";
import type { MultiplayerSessionMapper } from "src/reports/application/ports/i-multiplayer-session-mapper";
import { HostSessionDetailsReadModel } from "src/reports/application/queries/read-models/host.session.details.read.model";
import { PlayerSessionDetailsReadModel } from "src/reports/application/queries/read-models/player.session.details.read.model";
import { Meta, UserGameReportDetails, UserResult } from "src/reports/application/queries/read-models/user.report.detailts.read.model";

import { MultiplayerSessionMongo } from "../../entities/multiplayer-session.schema";
import type { IErrorMapper } from "src/core/errors/interface/mapper/i-error-mapper.interface";
import { IDatabaseErrorContext } from "src/core/errors/interface/context/i-error-database.context";
import { createDatabaseContext } from "src/core/errors/helpers/database-error-context.helper";

import { Either, ErrorData } from "src/core/types";

@DaoMongo(DaoName.MultiplayerSession)
@Injectable()
export class MultiplayerSessionsDaoMongo implements IMultiplayerSessionDao {
  private readonly contextBase = MULTIPLAYER_SESSIONS_MONGO_BASE;
  private readonly adapterName = MultiplayerSessionsDaoMongo.name;
  private readonly portName = 'IMultiplayerSessionDao';
  private readonly mapper: MultiplayerSessionMapper<MultiplayerSessionMongo, HostSessionDetailsReadModel, (PlayerSessionDetailsReadModel | null), UserResult > = new MultiplayerSessionMongoMapper();

  constructor(
    @InjectModel(MultiplayerSessionMongo.name)
    private readonly model: Model<MultiplayerSessionMongo>,
    @Inject(ERROR_TOKENS.MAPPERS.MONGO)
    private readonly mongoErrorMapper: IErrorMapper<unknown, IDatabaseErrorContext>,
  ) {}

  private getCtx(operation: string, entityId?: string, extra?: Record<string, unknown>) {
    return createDatabaseContext(this.contextBase, this.adapterName, this.portName, operation, entityId, extra);
  }

  async getHostDetailsById(sessionId: string, hostId: string): Promise<Either<ErrorData, HostSessionDetailsReadModel | null>> {
    const ctx = this.getCtx('getHostDetailsById', sessionId, { hostId });

    const result = await Either.tryCatch(
      this.model.findOne({ sessionId, hostId }).populate('kahootId').lean().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    if (result.isLeft()) return Either.makeLeft(result.getLeft());
    const session = result.getRight();

    return Either.makeRight(session ? this.mapper.mapHostDetails(session as any) : null);
  }

  async getPlayerDetailsById(sessionId: string, playerId: string): Promise<Either<ErrorData, PlayerSessionDetailsReadModel | null>> {
    const ctx = this.getCtx('getPlayerDetailsById', sessionId, { playerId });

    const result = await Either.tryCatch(
      this.model.findOne({ sessionId }).populate('kahootId').lean().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    if (result.isLeft()) return Either.makeLeft(result.getLeft());
    const session = result.getRight();
    

    return Either.makeRight(session ? this.mapper.mapPlayerDetails(session as any, playerId) : null);
  }

  async getUserSessionDetailsById(
    userId: string,
    limit: number = 20,
    page: number = 1
  ): Promise<Either<ErrorData, UserGameReportDetails | null>> {
    const ctx = this.getCtx('getUserSessionDetailsById', "List", { userId });
    const skip = (page - 1) * limit;

    // CAMBIO IMPORTANTE: Filtro $or
    const filter = {
      $or: [
        { hostId: userId },               // Es el anfitrión
        { 'players.playerId': userId }    // O es un jugador
      ]
    };

  const result = await Either.tryCatch(
      Promise.all([
        this.model.find(filter) // Usamos el filtro definido arriba
          .sort({ 'timeDetails.startedAt': -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.model.countDocuments(filter).exec() // El count también debe usar el mismo filtro
      ]),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );
    
    if (result.isLeft()) return Either.makeLeft(result.getLeft());
    const [sessions, total] = result.getRight();

    const results = sessions.map(s => this.mapper.mapUserDetails(s as any, userId));
    const meta: Meta = {
      totalItems: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit: limit
    };

    return Either.makeRight(new UserGameReportDetails(results, meta));
  }


  async isUserSessionHost(userId: string, sessionId: string): Promise<Either<ErrorData, boolean>> {
    const ctx = this.getCtx('isUserSessionHost', sessionId, { userId });

    const result = await Either.tryCatch(
      this.model.exists({ 
        sessionId: sessionId, 
        hostId: userId 
      }).exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    if (result.isLeft()) return Either.makeLeft(result.getLeft());

    // transforma el objeto (o null) en un booleano puro
    return Either.makeRight(!!result.getRight());
  }


  async isUserSessionPlayer(userId: string, sessionId: string): Promise<Either<ErrorData, boolean>> {
    const ctx = this.getCtx('isUserSessionPlayer', sessionId, { userId });

    const result = await Either.tryCatch(
      this.model.exists({
        sessionId: sessionId,
        'players.playerId': userId // Mongo busca dentro del array automáticamente
      }).exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    if (result.isLeft()) return Either.makeLeft(result.getLeft());

    return Either.makeRight(!!result.getRight());
  }
}