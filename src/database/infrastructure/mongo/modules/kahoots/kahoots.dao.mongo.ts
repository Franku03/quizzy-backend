// src/kahoots/infrastructure/persistence/mongo/kahoot.mongo-dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ErrorData, Either } from 'src/core/types';
import { IKahootDao } from 'src/kahoots/application/ports/i-kahoot.dao.interface';
import { IKahootDocument, KahootMongo } from '../../entities/kahoots.schema';

import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { KahootReadMapper } from './mappers/kahoot.handler.mapper';
import { MongoErrorMapper } from '../../errors/mongo-error.mapper';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';
import { KAHOOT_MONGO_BASE } from './constants/kahoot.mongo-constants';

@Injectable()
export class KahootDaoMongo implements IKahootDao {
  private readonly mongoErrorMapper = new MongoErrorMapper();
  private readonly kahootReadMapper = new KahootReadMapper();
  private readonly contextBase = KAHOOT_MONGO_BASE;
  private readonly adapterName = KahootDaoMongo.name;
  private readonly portName = 'IKahootDao';

  constructor(
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
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