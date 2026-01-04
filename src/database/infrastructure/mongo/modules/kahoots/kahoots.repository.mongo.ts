// src/kahoots/infrastructure/persistence/mongo/kahoot.repository.mongo.ts
import { Injectable } from '@nestjs/common';
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
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';

// El Mapper de Errores
import { MongoErrorMapper } from '../../errors/mongo-error.mapper';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

@Injectable()
export class KahootRepositoryMongo implements IKahootRepository {
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

  public async findKahootById(id: KahootId): Promise<Optional<Kahoot>> {
    console.warn('findKahootById is depprecated use either version');
    const result = await this.findKahootByIdEither(id.value);

    if (result.isLeft()) {
      throw result.getLeft();
    }

    const kahootOrNull = result.getRight();
    return kahootOrNull !== null
      ? new Optional(kahootOrNull)
      : new Optional();
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
      return KahootFactory.reconstructFromSnapshot(snapshot);

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

      const kahoots: Kahoot[] = [];

      for (const doc of documents) {
        const snapshot = this.prepareSnapshot(doc);
        const res = KahootFactory.reconstructFromSnapshot(snapshot);

        // Si falla la reconstrucción de un elemento,  decidir 
        // si lanzar el error o ignorar el elemento corrupto.
        if (res.isLeft()) return Either.makeLeft(res.getLeft());

        kahoots.push(res.getRight());
      }

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

  private prepareSnapshot(document: any): KahootSnapshot {
    const snapshot = { ...document };

    if (snapshot.createdAt instanceof Date) {
      snapshot.createdAt = snapshot.createdAt.toISOString().split('T')[0];
    }

    return snapshot as KahootSnapshot;
  }

}