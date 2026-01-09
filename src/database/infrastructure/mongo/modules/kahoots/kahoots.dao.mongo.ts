/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\modules\kahoots\kahoots.dao.mongo.ts

// --- NestJS & Mongoose ---
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// --- Core Logic & Types ---
import { ErrorData, Either } from 'src/core/types';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';

// --- Read Models & Snapshots ---
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { KahootUserDetailReadModel } from 'src/kahoots/application/dtos/kahoot-user-detail.read.model.dto';
import { KahootUserDetailInput } from './mappers/kahoot.user.details.mapper';


// --- Application Ports ---
import { IKahootDao } from 'src/kahoots/application/ports/i-kahoot.dao.interface';

// --- Infrastructure: Enums & Decorators ---
import { DaoMongo } from '../../decorators/dao-mongo.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

// --- Infrastructure: Entities & Constants ---
import { IKahootDocument, KahootMongo } from '../../entities/kahoots.schema';
import { UserMongo } from '../../entities/users.schema';
import { AttemptMongo } from '../../entities/attempts.scheme';
import { KAHOOT_MONGO_BASE } from './constants/kahoot.mongo-constants';

// --- Infrastructure: Mappers & Errors ---
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import type { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';

@DaoMongo(DaoName.Kahoot)
@Injectable()
export class KahootDaoMongo implements IKahootDao {
  private readonly contextBase = KAHOOT_MONGO_BASE;
  private readonly adapterName = KahootDaoMongo.name;
  private readonly portName = 'IKahootDao';

  constructor(
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
    @InjectModel(UserMongo.name)
    private readonly userModel: Model<UserMongo>,
    @InjectModel(AttemptMongo.name)
    private readonly attemptModel: Model<AttemptMongo>,
    @Inject(ERROR_TOKENS.MAPPERS.MONGO)
    private readonly mongoErrorMapper: IErrorMapper<unknown, IDatabaseErrorContext>,
    @Inject(APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_MONGO_SNAPSHOT)
    private readonly kahootReadMapper: IMapper<IKahootDocument, KahootSnapshot>,
    @Inject(APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_USER_DETAIL_MONGO_READ)
    private readonly userDetailMapper: IMapper<KahootUserDetailInput, KahootUserDetailReadModel>,
  ) { }
  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================

  /**
   * Genera el contexto de error inyectando la identidad del DAO.
   */
  private getCtx(operation: string, entityId?: string, extra?: Record<string, unknown>) {
    return createDatabaseContext(
      this.contextBase,
      this.adapterName,
      this.portName,
      operation,
      entityId,
      extra
    );
  }

  // ==========================================
  // IMPLEMENTACIÓN DE MÉTODOS (IKahootDao)
  // ==========================================

  async getKahootById(id: string): Promise<Either<ErrorData, KahootSnapshot | null>> {
    const ctx = this.getCtx('getKahootById', id);

    const result = await Either.tryCatch(
      this.kahootModel.findOne({ id }).lean<IKahootDocument>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    // Ahora usamos .map() del contrato IMapper
    return result.map(doc => doc ? this.kahootReadMapper.map(doc) : null);
  }

  async getKahootValidationDataByKahootId(id: string): Promise<Either<ErrorData, { userId: string, visibility: string } | null>> {
    const ctx = this.getCtx('getKahootValidationDataByKahootId', id);

    // Definimos una interfaz local para el select específico si no queremos traer todo el IKahootDocument
    interface ValidationData {
      authorId: string;
      visibility: string;
    }

    const result = await Either.tryCatch(
      this.kahootModel
        .findOne({ id })
        .select('authorId visibility')
        .lean<ValidationData>()
        .exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    return result.map(doc => {
      if (!doc) return null;
      return {
        userId: doc.authorId,
        visibility: doc.visibility
      };
    });
  }

  public async getKahootUserDetail(
    kahootId: string,
    userId: string,
  ): Promise<Either<ErrorData, KahootUserDetailReadModel | null>> {
    const ctx = this.getCtx('getKahootUserDetail', kahootId, { userId });
    return await Either.tryCatch<ErrorData, KahootUserDetailReadModel | null>(
      this.fetchAndMapUserDetail(kahootId, userId),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx),
    );
  }

  /**
   * Método privado para limpiar la lógica de orquestación y mapeo.
   * Esto hace que el tryCatch sea una sola línea.
   */
  private async fetchAndMapUserDetail(
    kahootId: string,
    userId: string
  ): Promise<KahootUserDetailReadModel | null> {
    const [kahoot, user, lastAttempt] = await Promise.all([
      this.kahootModel.findOne({ id: kahootId }).lean<IKahootDocument>().exec(),
      this.userModel.findOne({ userId }).lean<UserMongo>().exec(),
      this.attemptModel
        .findOne({ kahootId, playerId: userId })
        .sort({ 'timeDetails.lastPlayedAt': -1 })
        .lean<AttemptMongo>()
        .exec(),
    ]);

    if (!kahoot) return null;

    return this.userDetailMapper.map({ kahoot, user, lastAttempt });
  }
}
