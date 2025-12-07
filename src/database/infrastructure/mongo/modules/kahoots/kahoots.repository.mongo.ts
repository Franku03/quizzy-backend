// src/kahoots/infrastructure/persistence/mongo/kahoot.repository.mongo.ts
import { Model } from 'mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { KahootMongo } from 'src/database/infrastructure/mongo/entities/kahoots.schema';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { Optional } from 'src/core/types/optional';
import { KahootFactory } from 'src/kahoots/domain/factories/kahoot.factory';
import { KahootSnapshot } from 'src/core/domain/snapshots/snpapshot.kahoot';
import { Either } from 'src/core/types/either';
import { RepositoryError } from 'src/database/infrastructure/errors/repository-error';
import { MongoErrorFactory } from 'src/database/infrastructure/errors/mongo/mongo-error.factory';

@Injectable()
export class KahootRepositoryMongo implements IKahootRepository {
  private readonly logger = new Logger(KahootRepositoryMongo.name);
  
  constructor(
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
  ) {}

  private readonly collectionName = 'kahoots';

  // ========== MÉTODOS LEGACY ==========
  
  public async saveKahoot(kahoot: Kahoot): Promise<void> {
    this.logDeprecated('saveKahoot');
    const result = await this.saveKahootEither(kahoot);
    if (result.isLeft()) throw this.legacyErrorTransform(result.getLeft(), kahoot.id.value);
  }

  public async findKahootById(id: KahootId): Promise<Optional<Kahoot>> {
    this.logDeprecated('findKahootById');
    const result = await this.findKahootByIdEither(id);
    if (result.isLeft()) throw result.getLeft();
    return result.getRight();
  }

  public async findAllKahoots(): Promise<Kahoot[]> {
    this.logDeprecated('findAllKahoots');
    const result = await this.findAllKahootsEither();
    if (result.isLeft()) throw result.getLeft();
    return result.getRight();
  }

  public async deleteKahoot(id: KahootId): Promise<void> {
    this.logDeprecated('deleteKahoot');
    const result = await this.deleteKahootEither(id);
    if (result.isLeft()) throw result.getLeft();
  }

  // ========== MÉTODOS CON EITHER ==========
  
  public async saveKahootEither(kahoot: Kahoot): Promise<Either<RepositoryError, void>> {
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
      return Either.makeLeft(this.toRepositoryError(error, 'save', kahoot.id.value));
    }
  }

  public async findKahootByIdEither(id: KahootId): Promise<Either<RepositoryError, Optional<Kahoot>>> {
    try {
      const document = await this.kahootModel
        .findOne({ id: id.value })
        .lean()
        .exec();

      if (!document) {
        return Either.makeRight(new Optional<Kahoot>());
      }

      const snapshot = this.prepareSnapshot(document);
      const kahoot = KahootFactory.reconstructFromSnapshot(snapshot);
      return Either.makeRight(new Optional(kahoot));
    } catch (error) {
      return Either.makeLeft(this.toRepositoryError(error, 'findById', id.value));
    }
  }

  public async findAllKahootsEither(): Promise<Either<RepositoryError, Kahoot[]>> {
    try {
      const documents = await this.kahootModel
        .find()
        .lean()
        .exec();

      const kahoots = documents.map(doc => {
        const snapshot = this.prepareSnapshot(doc);
        return KahootFactory.reconstructFromSnapshot(snapshot);
      });
      
      return Either.makeRight(kahoots);
    } catch (error) {
      return Either.makeLeft(this.toRepositoryError(error, 'findAll'));
    }
  }

  public async deleteKahootEither(id: KahootId): Promise<Either<RepositoryError, void>> {
    try {
      await this.kahootModel
        .deleteOne({ id: id.value })
        .exec();
      
      return Either.makeRight(undefined);
    } catch (error) {
      return Either.makeLeft(this.toRepositoryError(error, 'delete', id.value));
    }
  }

  // ========== MÉTODOS ADICIONALES ==========
  
  public async existsKahootEither(id: KahootId): Promise<Either<RepositoryError, boolean>> {
    try {
      const count = await this.kahootModel
        .countDocuments({ id: id.value })
        .exec();
      
      return Either.makeRight(count > 0);
    } catch (error) {
      return Either.makeLeft(this.toRepositoryError(error, 'exists', id.value));
    }
  }

  // ========== MÉTODOS PRIVADOS ==========
  
  private toRepositoryError(error: any, operation: string, documentId?: string): RepositoryError {
    const context = {
      table: this.collectionName,
      operation,
      documentId,
    };

    if (MongoErrorFactory.isMongoError(error)) {
      return MongoErrorFactory.fromMongoError(error, context);
    }

    // Para errores no-MongoDB
    return MongoErrorFactory.unknownError({
      ...context,
      details: JSON.stringify({
        message: error?.message || String(error),
      }),
    });
  }

  private prepareSnapshot(document: any): KahootSnapshot {
    const snapshot = { ...document };
    
    if (snapshot.createdAt instanceof Date) {
      snapshot.createdAt = snapshot.createdAt.toISOString().split('T')[0];
    }
    
    return snapshot as KahootSnapshot;
  }

  private legacyErrorTransform(error: RepositoryError, kahootId: string): Error {
    // Solo para mantener compatibilidad con el error específico que esperabas
  
    
    return error;
  }

  private logDeprecated(methodName: string): void {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(
        `${methodName}() is deprecated. Use ${methodName}Either() instead.`
      );
    }
  }
}