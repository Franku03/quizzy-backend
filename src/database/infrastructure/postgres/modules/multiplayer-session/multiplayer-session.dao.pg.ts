// --- NestJS & TypeORM ---
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';

// --- Core Logic & Types ---
import { ErrorData, Either } from 'src/core/types';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';

// --- Read Models & Snapshots ---
import { HostSessionDetailsReadModel } from 'src/reports/application/queries/read-models/host.session.details.read.model';
import { PlayerSessionDetailsReadModel } from 'src/reports/application/queries/read-models/player.session.details.read.model';
import { GameType, Meta, UserGameReportDetails, UserResult } from 'src/reports/application/queries/read-models/user.report.detailts.read.model';

// --- Application Ports ---
import { IMultiplayerSessionDao } from 'src/reports/application/ports/i-multiplayer-session.dao.interface';

// --- Infrastructure: Enums & Decorators ---
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { DaoPostgres } from '../../decorators/dao-postgres.decorator';

// --- Infrastructure: Entities & Constants ---
import { MultiplayerSessionEntity } from '../../entities/multiplayer-session.entity.pg';
import { MULTIPLAYER_SESSIONS_POSTGRES_BASE } from './constants/multiplayer-sessions.pg-constants';


// --- Infrastructure: Mappers & Errors ---
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import type { MultiplayerSessionMapper } from 'src/reports/application/ports/i-multiplayer-session-mapper';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { MultiplayerSessionPgMapper } from './mappers/session.pg.mapper';

import { AttemptStatusEnum } from "src/solo-attempts/domain/value-objects/attempt.status.enum";
import { AttemptEntity } from '../../entities/attempt/attempt.entity.pg';
import { KahootEntity } from '../../entities/kahoot/kahoot.entity.pg';

@DaoPostgres(DaoName.MultiplayerSession)
@Injectable()
export class MultiplayerSessionsDaoPostgres implements IMultiplayerSessionDao {

  private readonly contextBase = MULTIPLAYER_SESSIONS_POSTGRES_BASE;
  private readonly adapterName = MultiplayerSessionsDaoPostgres.name;
  private readonly portName = 'IMultiplayerSessionDao';

  constructor(
    @InjectRepository(MultiplayerSessionEntity)
    private readonly repo: Repository<MultiplayerSessionEntity>,

    @InjectRepository(KahootEntity)
    private readonly kahootRepo: Repository<KahootEntity>,

    @InjectRepository(AttemptEntity)
    private readonly attemptRepo: Repository<AttemptEntity>,
    
    @Inject(ERROR_TOKENS.MAPPERS.POSTGRES)
    private readonly pgErrorMapper: IErrorMapper<unknown, IDatabaseErrorContext>,

    @Inject(APPLICATION_CORE_TOKENS.MAPPER.SESSION_REPORT_DETAILS_PG_READ)
    private readonly mapper: MultiplayerSessionMapper<MultiplayerSessionEntity, HostSessionDetailsReadModel, (PlayerSessionDetailsReadModel | null), UserResult >
  ) {}
  
  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================

  private getCtx(operation: string, entityId?: string, extra?: Record<string, unknown>) {
    return createDatabaseContext(
      this.contextBase,
      this.adapterName,
      this.portName,
      operation,
      entityId,
      extra
    );
  };


  // 1) Detalles para el Host (Vista de resultados generales)
  async getHostDetailsById(sessionId: string, hostId: string): Promise<Either<ErrorData, HostSessionDetailsReadModel | null >> {

    const ctx = this.getCtx('getHostDetailsById', sessionId, { hostId: hostId });

    const result = await Either.tryCatch(
        this.repo.findOne({
            where: { sessionId, hostId },
            relations: ['kahoot'] // Necesitamos el título del Kahoot
        }),
        (err) => this.pgErrorMapper.toErrorData(err, ctx)
    );
    
    if( result.isLeft() ) 
        return Either.makeLeft( result.getLeft() );

    const session = result.getRight();

    if(!session) 
        return Either.makeRight( null );

    return Either.makeRight( this.mapper.mapHostDetails( session ) as HostSessionDetailsReadModel );

  }

  // 2) Detalles para el Jugador (Su reporte individual)
  async getPlayerDetailsById(sessionId: string, playerId: string): Promise<Either<ErrorData, PlayerSessionDetailsReadModel | null >> {

    const ctx = this.getCtx('getPlayerDetailsById', sessionId, { playerId: playerId });

    const result = await Either.tryCatch(
        this.repo.findOne({
            where: { sessionId },
            relations: ['kahoot'] // Necesitamos el título del Kahoot
        }),
        (err) => this.pgErrorMapper.toErrorData(err, ctx)
    );
    
    if( result.isLeft() ) 
        return Either.makeLeft( result.getLeft() );

    const session = result.getRight();

    if(!session) 
        return Either.makeRight( null );

    return Either.makeRight( this.mapper.mapPlayerDetails( session, playerId ) as PlayerSessionDetailsReadModel);

  }


  async getUserSessionDetailsById(
    userId: string, 
    limit: number = 20, 
    page: number = 1
    ): Promise<Either<ErrorData, UserGameReportDetails| null>> {

    // Create a context object for error reporting and logging purposes
    // This helps track which operation failed and with what parameters
    const ctx = this.getCtx('getUserSessionDetailsById', "List", { userId: userId });
    
    // Calculate the number of items to skip based on current page and limit
    // Formula: (page - 1) * limit. Example: page 2 with limit 20 skips first 20 items
    const skip = (page - 1) * limit;

    try {

        // Why no LIMIT/OFFSET here? We need ALL multiplayer sessions to combine with 
        // solo attempts before sorting and paginating in memory
        const multiQuery = this.repo.createQueryBuilder('session')
        // JOIN with kahoot table to get the kahoot title
        // .leftJoinAndSelect(alias, aliasOfJoined) - fetches related entity data
        .leftJoinAndSelect('session.kahoot', 'kahoot')
        // Add raw SQL selection for JSONB field to use in ORDER BY
        // Syntax: "column->>'fieldName'" extracts text value from JSONB
        .addSelect("session.time_details->>'startedAt'", "started_at_sort")
        // Complex WHERE clause with Brackets for proper SQL grouping
        .where(
            new Brackets((qb) => {
            qb.where(`session.hostId = :userId`, { userId })
                // JSONB containment operator @> - checks if array contains object
                // We're checking if players array has an object with playerId = userId
                .orWhere(`session.players @> :playerFilter`, { 
                // Must stringify the object for JSONB comparison
                playerFilter: JSON.stringify([{ playerId: userId }]) 
                });
            })
        )
        // Order by the extracted JSONB field (most recent first)
        .orderBy("started_at_sort", "DESC");

        // Execute query with error handling via Either monad
        // Either.tryCatch wraps async operation and converts errors to ErrorData
        const multiResult = await Either.tryCatch(
        multiQuery.getMany(), // Get all entities (no pagination)
        (err) => this.pgErrorMapper.toErrorData(err, ctx)
        );

        // Early return if error occurred
        if (multiResult.isLeft()) return Either.makeLeft(multiResult.getLeft());
        const multiplayerSessions = multiResult.getRight();

        
        // We need separate count query because getMany() doesn't return count
        const multiCountResult = await Either.tryCatch(
        this.repo.createQueryBuilder('session')
            .where(
            new Brackets((qb) => {
                qb.where(`session.hostId = :userId`, { userId })
                .orWhere(`session.players @> :playerFilter`, { 
                    playerFilter: JSON.stringify([{ playerId: userId }]) 
                });
            })
            )
            .getCount(), // Returns just the count (number)
        (err) => this.pgErrorMapper.toErrorData(err, ctx)
        );

        if (multiCountResult.isLeft()) return Either.makeLeft(multiCountResult.getLeft());
        const multiTotal = multiCountResult.getRight();
        
        const soloQuery = this.attemptRepo.createQueryBuilder('attempt')
        .where('attempt.playerId = :userId', { userId })
        // Only include COMPLETED attempts (domain enum)
        .andWhere('attempt.status = :status', { status: AttemptStatusEnum.COMPLETED })
        // Sort by completion date for consistency with multiplayer ordering
        .orderBy('attempt.completedAt', 'DESC');

        const soloResult = await Either.tryCatch(
        soloQuery.getMany(), // Get all solo attempts
        (err) => this.pgErrorMapper.toErrorData(err, ctx)
        );

        if (soloResult.isLeft()) return Either.makeLeft(soloResult.getLeft());
        const soloAttempts = soloResult.getRight();
        
        const soloCountResult = await Either.tryCatch(
        this.attemptRepo.count({
            where: { 
            playerId: userId,
            status: AttemptStatusEnum.COMPLETED
            }
        }),
        (err) => this.pgErrorMapper.toErrorData(err, ctx)
        );

        if (soloCountResult.isLeft()) return Either.makeLeft(soloCountResult.getLeft());
        const soloTotal = soloCountResult.getRight();
        
        // The mapper is injected and handles transformation of entity -> UserResult
        // It contains business logic for determining gameType, finalScore, etc.
        const multiplayerResults = multiplayerSessions.map(session => 
        this.mapper.mapUserDetails(session, userId) as UserResult
        );

        // Using Set to get unique IDs for efficient bulk database query
        // Syntax: [...new Set(array)] removes duplicates
        const soloKahootIds = [...new Set(soloAttempts.map(attempt => attempt.kahootId))];
        
        let kahootTitleMap = new Map<string, string>();
        if (soloKahootIds.length > 0) {
        const kahootsResult = await Either.tryCatch(
            this.kahootRepo.find({
            // TypeORM's In() operator creates WHERE id IN (...) clause
            where: { id: In(soloKahootIds) },
            // Select only needed columns to reduce data transfer
            select: ['id', 'title']
            }),
            (err) => this.pgErrorMapper.toErrorData(err, ctx)
        );

        if (kahootsResult.isLeft()) return Either.makeLeft(kahootsResult.getLeft());
        
        const kahoots = kahootsResult.getRight();
        // Create a Map for O(1) lookups by kahootId
        // Format: Map<kahootId, title>
        kahootTitleMap = new Map(
            kahoots.map(k => [k.id, k.title || "Unknown Title"])
        );
        }
        
        const soloResults = soloAttempts.map(attempt => {
        // Get title from the pre-fetched map, fallback to default
        const title = kahootTitleMap.get(attempt.kahootId) || "Unknown Title";
        
        // Determine completion date: prefer completedAt, fallback to lastPlayedAt
        // This matches the MongoDB implementation logic
        const completionDate = attempt.completedAt || attempt.lastPlayedAt;
        
        // Construct UserResult following the DTO specification
        const userResult: UserResult = {
            kahootId: attempt.kahootId,         // Foreign key to kahoot
            gameId: attempt.id,                  // Use attempt.id as gameId for solo attempts
            gameType: GameType.SINGLEPLAYER,    // Enum value for frontend routing
            title: title,                        // Kahoot title from bulk fetch
            completionDate: completionDate,      // When the attempt was completed
            finalScore: attempt.totalScore,      // Solo attempts always have a score
            rankingPosition: undefined           // Solo attempts don't have ranking (as per spec)
        };
        return userResult;
        });
        
        // Combine arrays using spread operator
        const allResults = [...multiplayerResults, ...soloResults].sort((a, b) => {
        // Handle null/undefined completion dates gracefully
        // Items without dates go to the end
        if (!a.completionDate && !b.completionDate) return 0;  // Equal
        if (!a.completionDate) return 1;                       // a goes after b
        if (!b.completionDate) return -1;                      // a goes before b
        
        // Sort by completionDate descending (most recent first)
        // getTime() returns milliseconds since epoch for Date comparison
        return b.completionDate.getTime() - a.completionDate.getTime();
        });

        
        // Calculate slice indices for pagination
        // Example: page=2, limit=20 -> skip=20, startIndex=20, endIndex=40
        const startIndex = skip;
        const endIndex = skip + limit;
        const paginatedResults = allResults.slice(startIndex, endIndex);
        
        // Total items is sum of both collections
        const totalItems = multiTotal + soloTotal;
        
        // Meta object matches API specification
        const meta: Meta = {
        totalItems: totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit), // Ceil ensures partial pages count
        limit: limit
        };

        // Return successful result wrapped in Either monad
        return Either.makeRight(new UserGameReportDetails(paginatedResults, meta));

    } catch (error) {
        // Catch any unhandled exceptions and map them to ErrorData
        // This is a defensive programming practice
        return Either.makeLeft(this.pgErrorMapper.toErrorData(error, ctx));
    }
  }


  async isUserSessionHost(userId: string, sessionId: string): Promise<Either<ErrorData, boolean>> {
    const ctx = this.getCtx('isUserSessionHost', sessionId, { userId });

    const result = await Either.tryCatch(
        this.repo.count({
        where: { 
            sessionId: sessionId, 
            hostId: userId 
        }
        }),
        (err) => this.pgErrorMapper.toErrorData(err, ctx)
    );

    if (result.isLeft()) return Either.makeLeft(result.getLeft());

    // Si el conteo es mayor a 0, significa que el usuario es el host
    return Either.makeRight(result.getRight() > 0);
  }


  async isUserSessionPlayer(userId: string, sessionId: string): Promise<Either<ErrorData, boolean>> {
    const ctx = this.getCtx('isUserSessionPlayer', sessionId, { userId });

    const result = await Either.tryCatch(
        this.repo.createQueryBuilder('session')
        .where('session.sessionId = :sessionId', { sessionId })
        // Buscamos si el ID del jugador existe dentro de la lista de objetos 'players'
        .andWhere('session.players @> :playerFilter', { 
            playerFilter: JSON.stringify([{ playerId: userId }]) 
        })
        .getCount(),
        (err) => this.pgErrorMapper.toErrorData(err, ctx)
    );

    if (result.isLeft()) return Either.makeLeft(result.getLeft());

    return Either.makeRight(result.getRight() > 0);
  }

}