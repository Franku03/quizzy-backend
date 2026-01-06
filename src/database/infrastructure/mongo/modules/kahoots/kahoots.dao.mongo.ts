// src/kahoots/infrastructure/persistence/mongo/kahoot.mongo-dao.ts
// --- NestJS & Mongoose ---
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// --- Core Logic & Types ---
import { ErrorData, Either } from 'src/core/types';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';

// --- Domain Models & Snapshots ---
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';

// --- Application Ports ---
import { IKahootDao } from 'src/kahoots/application/ports/i-kahoot.dao.interface';

// --- Infrastructure: Enums & Decorators ---
import { DaoMongo } from '../../decorators/dao-mongo.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

// --- Infrastructure: Entities & Constants ---
import { IKahootDocument, KahootMongo } from '../../entities/kahoots.schema';
import { KAHOOT_MONGO_BASE } from './constants/kahoot.mongo-constants';

// --- Infrastructure: Mappers & Errors ---
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import type { IMapper } from 'src/core/application/mapper/i-mapper.interface';
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
    @Inject(ERROR_TOKENS.MAPPERS.MONGO)
    private readonly mongoErrorMapper: IErrorMapper<unknown, IDatabaseErrorContext>,
    @Inject(APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_READ)
    private readonly kahootReadMapper: IMapper<IKahootDocument, KahootSnapshot>,
  ) {}
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
}