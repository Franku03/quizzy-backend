import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ERROR_TOKENS } from "src/core/errors/dependecy-tokens/application-core-erros.tokens";

import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";
import { DaoMongo } from "../../decorators/dao-mongo.decorator";
import { IMultiplayerSessionDao } from "src/reports/application/ports/i-multiplayer-session.dao.interface";
import { MULTIPLAYER_SESSIONS_MONGO_BASE } from "./constants/multiplayer-session.mongo-constants";
import { AttemptMongo} from '../../entities/attempts.scheme';
import { KahootMongo } from "../../entities/kahoots.schema";
import { AttemptStatusEnum } from "src/solo-attempts/domain/value-objects/attempt.status.enum";

import { MultiplayerSessionMongoMapper } from "./mappers/session.mongo.mapper";
import type { MultiplayerSessionMapper } from "src/reports/application/ports/i-multiplayer-session-mapper";
import { HostSessionDetailsReadModel } from "src/reports/application/queries/read-models/host.session.details.read.model";
import { PlayerSessionDetailsReadModel } from "src/reports/application/queries/read-models/player.session.details.read.model";
import { GameType, Meta, UserGameReportDetails, UserResult } from "src/reports/application/queries/read-models/user.report.detailts.read.model";

import { MultiplayerSessionMongo } from "../../entities/multiplayer-session.schema";
import type { IErrorMapper } from "src/core/errors/interface/mapper/i-error-mapper.interface";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";
import { IDatabaseErrorContext } from "src/core/errors/interface/context/i-error-database.context";
import { createDatabaseContext } from "src/core/errors/helpers/database-error-context.helper";

import { Either, ErrorData } from "src/core/types";

@DaoMongo(DaoName.MultiplayerSession)
@Injectable()
export class MultiplayerSessionsDaoMongo implements IMultiplayerSessionDao {
  private readonly contextBase = MULTIPLAYER_SESSIONS_MONGO_BASE;
  private readonly adapterName = MultiplayerSessionsDaoMongo.name;
  private readonly portName = 'IMultiplayerSessionDao';

  constructor(
    @InjectModel(MultiplayerSessionMongo.name)
    private readonly model: Model<MultiplayerSessionMongo>,
    @InjectModel(AttemptMongo.name)
    private readonly attemptModel: Model<AttemptMongo>,
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
    @Inject(ERROR_TOKENS.MAPPERS.MONGO)
    private readonly mongoErrorMapper: IErrorMapper<unknown, IDatabaseErrorContext>,
    @Inject( APPLICATION_CORE_TOKENS.MAPPER.SESSION_REPORT_DETAILS_MONGO_READ )
    private readonly mapper: MultiplayerSessionMapper<MultiplayerSessionMongo, HostSessionDetailsReadModel, (PlayerSessionDetailsReadModel | null), UserResult >
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

    // Fetch multiplayer sessions and solo attempts in parallel for efficiency
    const result = await Either.tryCatch(
      Promise.all([
        // 1. Get multiplayer sessions where user is host OR player
        this.model.find({
          $or: [
            { hostId: userId },               // User is the host
            { 'players.playerId': userId }    // User is a player
          ]
        })
        .sort({ 'timeDetails.startedAt': -1 }) // Sort by most recent first
        .lean()
        .exec(),
        
        // 2. Get completed solo attempts for the user
        this.attemptModel.find({
          playerId: userId,
          status: AttemptStatusEnum.COMPLETED // Only include completed attempts
        })
        .sort({ 'timeDetails.startedAt': -1 }) // Sort by most recent first
        .lean()
        .exec(),
        
        // 3. Get total counts for pagination
        this.model.countDocuments({
          $or: [
            { hostId: userId },
            { 'players.playerId': userId }
          ]
        }).exec(),
        
        // 4. Get total solo attempts count
        this.attemptModel.countDocuments({
          playerId: userId,
          status: AttemptStatusEnum.COMPLETED
        }).exec()
      ]),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );
    
    if (result.isLeft()) return Either.makeLeft(result.getLeft());
    
    const [multiplayerSessions, soloAttempts, multiTotal, soloTotal] = result.getRight();
    
    // Map multiplayer sessions to UserResult using existing mapper
    const multiplayerResults = multiplayerSessions.map(session => 
      this.mapper.mapUserDetails(session as any, userId)
    );
    
    // Get unique kahoot IDs from solo attempts to fetch titles
    const soloKahootIds = [...new Set(soloAttempts.map(attempt => attempt.kahootId))];
    
    // Fetch kahoot titles in bulk for better performance
    let kahootTitleMap = new Map<string, string>();
    if (soloKahootIds.length > 0) {
      const kahootsResult = await Either.tryCatch(
        this.kahootModel.find(
          { id: { $in: soloKahootIds } },
          { id: 1, details: 1 } // Only fetch id and details (which contains title)
        ).lean().exec(),
        (err) => this.mongoErrorMapper.toErrorData(err, ctx)
      );
      
      if (kahootsResult.isLeft()) return Either.makeLeft(kahootsResult.getLeft());
      
      const kahoots = kahootsResult.getRight();
      // Create a map of kahootId -> title for quick lookup
      kahootTitleMap = new Map(
        kahoots.map(k => [k.id, k.details?.title || "Unknown Title"])
      );
    }
    
    // Map solo attempts to UserResult with actual titles
    const soloResults = soloAttempts.map(attempt => {
      // Get title from map, fallback to default if not found
      const title = kahootTitleMap.get(attempt.kahootId) || "Unknown Title";
      
      // Create UserResult for solo attempt
      const userResult: UserResult = {
        kahootId: attempt.kahootId,
        gameId: attempt.id, // Use attempt.id as gameId for solo attempts
        gameType: GameType.SINGLEPLAYER,
        title: title,
        completionDate: attempt.timeDetails.completedAt || attempt.timeDetails.lastPlayedAt,
        finalScore: attempt.totalScore, // Solo attempts have totalScore
        rankingPosition: undefined // Solo attempts don't have ranking
      };
      return userResult;
    });
    
    // Combine and sort all results by completionDate (most recent first)
    const allResults = [...multiplayerResults, ...soloResults].sort((a, b) => {
      // Handle null/undefined completion dates by putting them at the end
      if (!a.completionDate && !b.completionDate) return 0;
      if (!a.completionDate) return 1;
      if (!b.completionDate) return -1;
      
      // Sort by completionDate descending (most recent first)
      return b.completionDate.getTime() - a.completionDate.getTime();
    });
    
    // Calculate total items across both collections
    const totalItems = multiTotal + soloTotal;
    
    // Apply pagination to the combined, sorted results
    const startIndex = skip;
    const endIndex = skip + limit;
    const paginatedResults = allResults.slice(startIndex, endIndex);
    
    const meta: Meta = {
      totalItems: totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      limit: limit
    };

    return Either.makeRight(new UserGameReportDetails(paginatedResults, meta));
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