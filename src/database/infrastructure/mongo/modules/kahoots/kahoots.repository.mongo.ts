// src/kahoots/infrastructure/persistence/mongo/kahoot.repository.mongo.ts

import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { KahootMongo, IKahootDocument } from '../../entities/kahoots.schema';

// Tipos Core
import { Optional, Either, ErrorData } from 'src/core/types';

// Dominio
import { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { KahootFactory } from 'src/kahoots/domain/factories/kahoot.factory';

// Infraestructura & Helpers
import { MongoErrorMapper } from '../../errors/mongo-error.mapper';
import { KahootReadMapper } from './mappers/kahoot.handler.mapper';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';
import { KAHOOT_MONGO_BASE } from './constants/kahoot.mongo-constants';

@Injectable()
export class KahootRepositoryMongo implements IKahootRepository {
  private readonly mongoErrorMapper = new MongoErrorMapper();
  private readonly kahootReadMapper = new KahootReadMapper(); 
  private readonly contextBase = KAHOOT_MONGO_BASE;
  private readonly adapterName = KahootRepositoryMongo.name;
  private readonly portName = 'IKahootRepository';

  constructor(
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
  ) { }

  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================

  /**
   * Genera el contexto usando la factory del Core.
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
  // MÉTODOS DE DOMINIO (Escritura / Lectura)
  // ==========================================

  public async saveKahootEither(kahoot: Kahoot): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('save', kahoot.id.value);

    const result = await Either.tryCatch(
      this.kahootModel.findOneAndUpdate(
        { id: kahoot.id.value },
        kahoot.getSnapshot(),
        { upsert: true, new: true, runValidators: true }
      ).lean<IKahootDocument>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    return result.map(() => undefined);
  }

  public async findKahootByIdEither(id: string): Promise<Either<ErrorData, Kahoot | null>> {
    const ctx = this.getCtx('findById', id);

    const result = await Either.tryCatch(
      this.kahootModel.findOne({ id }).lean<IKahootDocument>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    return result.chain(doc => {
      if (!doc) return Either.makeRight(null);
      const snapshot = this.kahootReadMapper.map(doc);
      return KahootFactory.reconstructFromSnapshot(snapshot);
    });
  }

  public async findAllKahootsEither(): Promise<Either<ErrorData, Kahoot[]>> {
    const ctx = this.getCtx('findAll');

    const result = await Either.tryCatch(
      this.kahootModel.find().lean<IKahootDocument[]>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    return result.chain(documents => {
      const kahoots: Kahoot[] = [];
      for (const doc of documents) {
        const snapshot = this.kahootReadMapper.map(doc);
        const res = KahootFactory.reconstructFromSnapshot(snapshot);
        
        if (res.isLeft()) return Either.makeLeft(res.getLeft());
        kahoots.push(res.getRight());
      }
      return Either.makeRight(kahoots);
    });
  }

  public async deleteKahootEither(id: string): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('delete', id);

    const result = await Either.tryCatch(
      this.kahootModel.deleteOne({ id }).exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    return result.map(() => undefined);
  }

  public async existsKahootEither(id: string): Promise<Either<ErrorData, boolean>> {
    const ctx = this.getCtx('exists', id);

    const result = await Either.tryCatch(
      this.kahootModel.countDocuments({ id }).exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    return result.map(count => count > 0);
  }

  // ==========================================
  // CAPA DE ADAPTACIÓN (Legacy / Helper)
  // ==========================================

  public async findKahootById(id: KahootId): Promise<Optional<Kahoot>> {
    const result = await this.findKahootByIdEither(id.value);
    if (result.isLeft()) throw result.getLeft();
    const kahootOrNull = result.getRight();
    return kahootOrNull !== null ? new Optional(kahootOrNull) : new Optional();
  }
}