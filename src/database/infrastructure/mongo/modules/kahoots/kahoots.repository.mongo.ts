// src/kahoots/infrastructure/persistence/mongo/kahoot.repository.mongo.ts
import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { KahootMongo } from '../../entities/kahoots.schema';

// Importaciones de tipos consolidadas
import { Optional, Either, ErrorData } from 'src/core/types';

// Tipos, interfaces y dependencias del Dominio/Core
import { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { KahootFactory } from 'src/kahoots/domain/factories/kahoot.factory';
import { KahootSnapshot } from 'src/core/domain/snapshots/snpapshot.kahoot';

// El Mapper de Errores
import { MongoErrorMapper } from '../../errors/mongo-error.mapper';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

@Injectable()
export class KahootRepositoryMongo implements IKahootRepository {
  private readonly logger = new Logger(KahootRepositoryMongo.name);

  // Propiedades de contexto tipadas
  private readonly adapterContextBase: IDatabaseErrorContext = {
    adapterName: KahootRepositoryMongo.name,
    portName: 'IKahootRepository',
    module: 'kahoots',
    databaseType: 'mongodb',
    collectionOrTable: 'kahoots',
    operation: '', // Base que se sobreescribe
  } as const;

  private readonly mongoErrorMapper: MongoErrorMapper = new MongoErrorMapper();

  constructor(
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
  ) { }

  // ========== MÉTODOS LEGACY (NO CAMBIAN - usan KahootId) ==========

  public async saveKahoot(kahoot: Kahoot): Promise<void> {
    this.logDeprecated('saveKahoot');
    const result = await this.saveKahootEither(kahoot);
    this.handleLegacyResult(result);
  }

  public async findKahootById(id: KahootId): Promise<Optional<Kahoot>> {
    this.logDeprecated('findKahootById');
    const result = await this.findKahootByIdEither(id.value);
    
    if (result.isLeft()) {
      throw result.getLeft();
    }
    
    const kahootOrNull = result.getRight();
    return kahootOrNull !== null 
      ? new Optional(kahootOrNull) 
      : new Optional();
  }

  public async findAllKahoots(): Promise<Kahoot[]> {
    this.logDeprecated('findAllKahoots');
    const result = await this.findAllKahootsEither();
    return this.handleLegacyResult(result);
  }

  public async deleteKahoot(id: KahootId): Promise<void> {
    this.logDeprecated('deleteKahoot');
    const result = await this.deleteKahootEither(id.value);
    this.handleLegacyResult(result);
  }

  // ========== MÉTODOS CON EITHER (NUEVOS - usan string) ==========

  public async saveKahootEither(kahoot: Kahoot): Promise<Either<ErrorData, void>> {
    const context: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'save',
      entityId: kahoot.id.value,
    };

    try {
      await this.kahootModel
        .findOneAndUpdate(
          { id: kahoot.id.value },
          kahoot.getSnapshot(),
          { upsert: true, new: true, runValidators: true }
        )
        .exec();

      return Either.makeRight(undefined);
    } catch (error) {
      return Either.makeLeft(this.mongoErrorMapper.toErrorData(error, context));
    }
  }

  public async findKahootByIdEither(id: string): Promise<Either<ErrorData, Kahoot | null>> {
    const context: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'findById',
      entityId: id,
    };

    try {
      const document = await this.kahootModel
        .findOne({ id })
        .lean()
        .exec();

      if (!document) {
        return Either.makeRight<ErrorData, Kahoot | null>(null);
      }

      const snapshot = this.prepareSnapshot(document);
      const kahoot = KahootFactory.reconstructFromSnapshot(snapshot);
      return Either.makeRight<ErrorData, Kahoot | null>(kahoot);

    } catch (error) {
      return Either.makeLeft(this.mongoErrorMapper.toErrorData(error, context));
    }
  }

  public async findAllKahootsEither(): Promise<Either<ErrorData, Kahoot[]>> {
    const context: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'findAll',
    };

    try {
      const documents = await this.kahootModel.find().lean().exec();
      const kahoots = documents.map(doc => {
        const snapshot = this.prepareSnapshot(doc);
        return KahootFactory.reconstructFromSnapshot(snapshot);
      });

      return Either.makeRight(kahoots);
    } catch (error) {
      return Either.makeLeft(this.mongoErrorMapper.toErrorData(error, context));
    }
  }

  public async deleteKahootEither(id: string): Promise<Either<ErrorData, void>> {
    const context: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'delete',
      entityId: id,
    };

    try {
      await this.kahootModel.deleteOne({ id }).exec();
      return Either.makeRight(undefined);
    } catch (error) {
      return Either.makeLeft(this.mongoErrorMapper.toErrorData(error, context));
    }
  }

  public async existsKahootEither(id: string): Promise<Either<ErrorData, boolean>> {
    const context: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'exists',
      entityId: id,
    };

    try {
      const count = await this.kahootModel.countDocuments({ id }).exec();
      return Either.makeRight(count > 0);
    } catch (error) {
      return Either.makeLeft(this.mongoErrorMapper.toErrorData(error, context));
    }
  }

  // ========== MÉTODOS PRIVADOS ==========

  private handleLegacyResult<E extends ErrorData, T>(result: Either<E, T>): T {
    if (result.isLeft()) {
      throw result.getLeft();
    }
    return result.getRight();
  }

  private prepareSnapshot(document: any): KahootSnapshot {
    const snapshot = { ...document };

    if (snapshot.createdAt instanceof Date) {
      snapshot.createdAt = snapshot.createdAt.toISOString().split('T')[0];
    }

    return snapshot as KahootSnapshot;
  }

  private logDeprecated(methodName: string): void {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(
        `${methodName}() is deprecated. Use ${methodName}Either() instead.`
      );
    }
  }
}