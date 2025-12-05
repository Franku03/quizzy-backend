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
import { RepositoryError } from 'src/database/domain/repository';
import { MongoErrorAdapter } from 'src/database/infrastructure/errors/mongo.error.adapter';

@Injectable()
export class KahootRepositoryMongo implements IKahootRepository {
  constructor(
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
  ) {}

  private readonly collectionName = 'kahoots';

  public async saveKahoot(kahoot: Kahoot): Promise<void> {
    const persistenceData = kahoot.getSnapshot();
    try {
      await this.kahootModel
        .findOneAndUpdate({ id: kahoot.id.value }, persistenceData, {
          upsert: true,
          new: true,
          runValidators: true,
        })
        .exec();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error(
          `Kahoot ID ${kahoot.id.value} ya existe en la base de datos.`,
        );
      }
      throw error;
    }
  }

  public async findKahootById(id: KahootId): Promise<Optional<Kahoot>> {
    const document = await this.kahootModel.findOne({ id: id.value }).exec();

    if (!document) {
      return new Optional<Kahoot>();
    }

    const snapshot = document.toObject() as KahootSnapshot;
    snapshot.createdAt = (snapshot.createdAt as unknown as Date).toISOString().split('T')[0];
    
    const kahoot = KahootFactory.reconstructFromSnapshot(snapshot);
    return new Optional(kahoot);
  }

  public async findAllKahoots(): Promise<Kahoot[]> {
    const documents = await this.kahootModel.find().exec();

    return documents.map((doc) => {
      const snapshot = doc.toObject() as KahootSnapshot;
      snapshot.createdAt = (snapshot.createdAt as unknown as Date).toISOString().split('T')[0];
      return KahootFactory.reconstructFromSnapshot(snapshot);
    });
  }

  public async deleteKahoot(id: KahootId): Promise<void> {
    await this.kahootModel.deleteOne({ id: id.value }).exec();
  }

  // === MÉTODOS CON EITHER USANDO RepositoryError ===
  public async saveKahootEither(kahoot: Kahoot): Promise<Either<RepositoryError, void>> {
    const persistenceData = kahoot.getSnapshot();
    
    try {
      await this.kahootModel
        .findOneAndUpdate(
          { id: kahoot.id.value }, 
          persistenceData, 
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        )
        .exec();
      
      return Either.makeRight(undefined);
    } catch (error) {
      const repositoryError = MongoErrorAdapter.toRepositoryError(
        error,
        this.collectionName,
        'save',
        kahoot.id.value
      );
      return Either.makeLeft(repositoryError);
    }
  }

  public async findKahootByIdEither(id: KahootId): Promise<Either<RepositoryError, Optional<Kahoot>>> {
    try {
      const document = await this.kahootModel
        .findOne({ id: id.value })
        .exec();

      if (!document) {
        return Either.makeRight(new Optional<Kahoot>());
      }

      const snapshot = document.toObject() as KahootSnapshot;
      snapshot.createdAt = (snapshot.createdAt as unknown as Date).toISOString().split('T')[0];
      
      const kahoot = KahootFactory.reconstructFromSnapshot(snapshot);
      return Either.makeRight(new Optional(kahoot));
    } catch (error) {
      const repositoryError = MongoErrorAdapter.toRepositoryError(
        error,
        this.collectionName,
        'findById',
        id.value
      );
      return Either.makeLeft(repositoryError);
    }
  }

  public async findAllKahootsEither(): Promise<Either<RepositoryError, Kahoot[]>> {
    try {
      const documents = await this.kahootModel.find().exec();

      const kahoots = documents.map((doc) => {
        const snapshot = doc.toObject() as KahootSnapshot;
        snapshot.createdAt = (snapshot.createdAt as unknown as Date).toISOString().split('T')[0];
        return KahootFactory.reconstructFromSnapshot(snapshot);
      });
      
      return Either.makeRight(kahoots);
    } catch (error) {
      const repositoryError = MongoErrorAdapter.toRepositoryError(
        error,
        this.collectionName,
        'findAll'
      );
      return Either.makeLeft(repositoryError);
    }
  }

  public async deleteKahootEither(id: KahootId): Promise<Either<RepositoryError, void>> {
    try {
      await this.kahootModel
        .deleteOne({ id: id.value })
        .exec();
      
      return Either.makeRight(undefined);
    } catch (error) {
      const repositoryError = MongoErrorAdapter.toRepositoryError(
        error,
        this.collectionName,
        'delete',
        id.value
      );
      return Either.makeLeft(repositoryError);
    }
  }
}