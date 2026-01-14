// --- NestJS & TypeORM ---
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// --- Core Logic & Types ---
import { ErrorData, Either } from 'src/core/types';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';

// --- Read Models & Snapshots ---
import { HostSessionDetailsReadModel } from 'src/reports/application/queries/read-models/host.session.details.read.model';
import { PlayerSessionDetailsReadModel } from 'src/reports/application/queries/read-models/player.session.details.read.model';
import { Meta, UserGameReportDetails, UserResult } from 'src/reports/application/queries/read-models/user.report.detailts.read.model';

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
import { MultiplayerSessionPgMapper } from './mappers/session.pg.mapper';

@DaoPostgres(DaoName.MultiplayerSession)
@Injectable()
export class MultiplayerSessionsDaoPostgres implements IMultiplayerSessionDao {

  private readonly contextBase = MULTIPLAYER_SESSIONS_POSTGRES_BASE;
  private readonly adapterName = MultiplayerSessionsDaoPostgres.name;
  private readonly portName = 'IMultiplayerSessionDao';
  private readonly mapper: MultiplayerSessionMapper<MultiplayerSessionEntity, HostSessionDetailsReadModel, (PlayerSessionDetailsReadModel | null), UserResult > =  new MultiplayerSessionPgMapper();

  constructor(
    @InjectRepository(MultiplayerSessionEntity)
    private readonly repo: Repository<MultiplayerSessionEntity>,
    
    @Inject(ERROR_TOKENS.MAPPERS.POSTGRES)
    private readonly pgErrorMapper: IErrorMapper<unknown, IDatabaseErrorContext>,

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

  // 3) Resumen de sesión para el perfil del usuario (Historial)
  async getUserSessionDetailsById(
    userId: string, 
    limit: number = 20, 
    page: number = 1
  ): Promise<Either<ErrorData, UserGameReportDetails| null>> {

    const ctx = this.getCtx('getUserSessionDetailsById', "List", { userId: userId });

    const skip = (page - 1) * limit;

    // Usamos QueryBuilder para tener control total sobre la búsqueda en JSONB
    const res = await Either.tryCatch(
        this.repo.createQueryBuilder('session')
        .leftJoinAndSelect('session.kahoot', 'kahoot')
        // El operador @> busca si el JSON de la derecha está contenido en la columna players
        // Proyectamos el valor del JSON a un alias para que TypeORM lo reconozca
        .addSelect("session.time_details->>'startedAt'", "started_at_sort")
        .where(`session.players @> :playerFilter`, { 
            playerFilter: JSON.stringify([{ playerId: userId }]) 
        })
        // Ordenamos por el alias plano
        .orderBy("started_at_sort", "DESC")
        .take(limit)
        .skip(skip)
        .getManyAndCount()
        ,
        (err) => this.pgErrorMapper.toErrorData(err, ctx)
    );

    if( res.isLeft() ) 
        return Either.makeLeft( res.getLeft() );

    const [sessions, total] = res.getRight();

    const results: UserResult[] = sessions.map(session => {
        return this.mapper.mapUserDetails( session, userId ) as UserResult;
    });

    const totalPages = Math.ceil(total / limit);

    const meta: Meta = {
        totalItems: total,
        currentPage: page,
        totalPages: totalPages,
        limit: limit
    };

    return Either.makeRight(new UserGameReportDetails(results, meta));


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