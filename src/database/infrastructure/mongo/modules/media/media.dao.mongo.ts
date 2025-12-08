// src/media/infrastructure/persistence/mongo/asset-metadata.mongo-dao.ts
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IAssetMetadataDao } from 'src/media/application/ports/asset-metadata.dao';
import { AssetMetadataRecord } from 'src/media/application/ports/asset-metadata-record.interface';
import { ErrorData, Either, ErrorLayer } from 'src/core/types';
import { AssetMetadataMongo } from '../../entities/media.schema';
import { MongoErrorMapper } from '../../errors/mongo-error.mapper';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

@Injectable()
export class AssetMetadataMongoDao implements IAssetMetadataDao {

  private readonly adapterContextBase: IDatabaseErrorContext = {
    adapterName: AssetMetadataMongoDao.name,
    portName: 'IAssetMetadataDao',
    module: 'media',
    databaseType: 'mongodb',
    collectionOrTable: 'asset_metadata',
    operation: '', // Base que se sobreescribe
  } as const;

  private readonly mongoErrorMapper: MongoErrorMapper = new MongoErrorMapper();

  constructor(
    @InjectModel(AssetMetadataMongo.name)
    private readonly model: Model<AssetMetadataMongo>,
  ) { }

  private toRecord(doc: AssetMetadataMongo): AssetMetadataRecord { 
    return doc as unknown as AssetMetadataRecord; 
  }
  
  private fromRecord(record: AssetMetadataRecord): Partial<AssetMetadataMongo> { 
    return record as unknown as Partial<AssetMetadataMongo>; 
  }

  async insert(record: AssetMetadataRecord): Promise<Either<ErrorData, void>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'insert',
      entityId: record.publicId,
    };

    try {
      const data = this.fromRecord(record);
      await this.model.create(data);
      return Either.makeRight<ErrorData, void>(undefined);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft<ErrorData, void>(errorData);
    }
  }

  async findByPublicId(publicId: string): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'findByPublicId',
      entityId: publicId,
    };

    try {
      const doc = await this.model.findOne({ publicId }).exec();

      if (!doc) {
        return Either.makeRight<ErrorData, AssetMetadataRecord | null>(null);
      }

      return Either.makeRight<ErrorData, AssetMetadataRecord | null>(this.toRecord(doc));
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft<ErrorData, AssetMetadataRecord | null>(errorData);
    }
  }

  async findByContentHash(contentHash: string): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'findByContentHash',
      entityId: contentHash,
    };

    try {
      const doc = await this.model.findOne({ contentHash }).exec();

      if (!doc) {
        return Either.makeRight<ErrorData, AssetMetadataRecord | null>(null);
      }

      return Either.makeRight<ErrorData, AssetMetadataRecord | null>(this.toRecord(doc));
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft<ErrorData, AssetMetadataRecord | null>(errorData);
    }
  }

  async findByIds(assetIds: string[]): Promise<Either<ErrorData, AssetMetadataRecord[]>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'findByIds',
    };

    try {
      const docs = await this.model.find({
        assetId: { $in: assetIds }
      }).exec();

      const records = docs.map(doc => this.toRecord(doc));
      return Either.makeRight<ErrorData, AssetMetadataRecord[]>(records);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft<ErrorData, AssetMetadataRecord[]>(errorData);
    }
  }

  async incrementReferenceCount(publicId: string): Promise<Either<ErrorData, void>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'incrementReferenceCount',
      entityId: publicId,
    };

    try {
      const result = await this.model.findOneAndUpdate(
        { publicId },
        { $inc: { referenceCount: 1 } },
        { new: true, runValidators: true }
      );

      if (!result) {
        const notFoundError = new ErrorData(
          "RESOURCE_NOT_FOUND",
          `Asset metadata with publicId '${publicId}' not found.`,
          ErrorLayer.INFRASTRUCTURE,
          fullContext
        );
        return Either.makeLeft<ErrorData, void>(notFoundError);
      }

      return Either.makeRight<ErrorData, void>(undefined);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft<ErrorData, void>(errorData);
    }
  }

  async decrementReferenceCount(publicId: string): Promise<Either<ErrorData, void>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'decrementReferenceCount',
      entityId: publicId,
    };

    try {
      const asset = await this.model.findOne({ publicId });

      if (!asset) {
        const notFoundError = new ErrorData(
          "RESOURCE_NOT_FOUND",
          `Asset metadata with publicId '${publicId}' not found for decrement.`,
          ErrorLayer.INFRASTRUCTURE,
          fullContext
        );
        return Either.makeLeft<ErrorData, void>(notFoundError);
      }

      if (asset.referenceCount <= 0) {
        const validationError = new ErrorData(
          "REFERENCE_COUNT_INVALID",
          'Cannot decrement reference count below zero.',
          ErrorLayer.INFRASTRUCTURE,
          { ...fullContext, currentValue: asset.referenceCount }
        );
        return Either.makeLeft<ErrorData, void>(validationError);
      }

      const result = await this.model.findOneAndUpdate(
        { publicId },
        { $inc: { referenceCount: -1 } },
        { new: true, runValidators: true }
      );

      if (!result) {
        const notFoundError = new ErrorData(
          "RESOURCE_NOT_FOUND",
          `Asset metadata with publicId '${publicId}' vanished during decrement.`,
          ErrorLayer.INFRASTRUCTURE,
          fullContext
        );
        return Either.makeLeft<ErrorData, void>(notFoundError);
      }

      return Either.makeRight<ErrorData, void>(undefined);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft<ErrorData, void>(errorData);
    }
  }

  async deleteByPublicId(publicId: string): Promise<Either<ErrorData, void>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'deleteByPublicId',
      entityId: publicId,
    };

    try {
      const result = await this.model.findOneAndDelete({ publicId });

      if (!result) {
        const notFoundError = new ErrorData(
          "RESOURCE_NOT_FOUND",
          `Asset metadata with publicId '${publicId}' not found for deletion.`,
          ErrorLayer.INFRASTRUCTURE,
          fullContext
        );
        return Either.makeLeft<ErrorData, void>(notFoundError);
      }

      return Either.makeRight<ErrorData, void>(undefined);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft<ErrorData, void>(errorData);
    }
  }
}