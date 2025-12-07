// src/media/infrastructure/persistence/mongo/asset-metadata.mongo-dao.ts
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IAssetMetadataDao } from 'src/media/application/ports/asset-metadata.dao';
import { AssetMetadataRecord } from 'src/media/application/ports/asset-metadata-record.interface';
import { 
  RepositoryResult, 
  OptionalRepositoryResult,
  RepositoryResultHelpers 
} from 'src/core/types/repository-result.type';
import { AssetMetadataMongo } from '../../entities/media.schema';
import { MongoErrorFactory } from 'src/database/infrastructure/errors/mongo/mongo-error.factory';

@Injectable()
export class AssetMetadataMongoDao implements IAssetMetadataDao {
  private readonly context = {
    repositoryName: 'AssetMetadataRepository',
    table: 'asset_metadata',
    module: 'media',
  };

  constructor(
    @InjectModel(AssetMetadataMongo.name)
    private readonly model: Model<AssetMetadataMongo>,
  ) {}

  private toRecord(doc: AssetMetadataMongo): AssetMetadataRecord {
    return {
      assetId: doc.assetId,
      publicId: doc.publicId,
      provider: doc.provider,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      contentHash: doc.contentHash,
      referenceCount: doc.referenceCount,
      format: doc.format,
      category: doc.category,
      uploadedAt: doc.uploadedAt,
    };
  }

  private fromRecord(record: AssetMetadataRecord): Partial<AssetMetadataMongo> {
    return {
      assetId: record.assetId,
      publicId: record.publicId,
      provider: record.provider,
      originalName: record.originalName,
      mimeType: record.mimeType,
      size: record.size,
      contentHash: record.contentHash,
      referenceCount: record.referenceCount,
      format: record.format,
      category: record.category,
      uploadedAt: record.uploadedAt,
    };
  }

  async insert(record: AssetMetadataRecord): Promise<RepositoryResult<void>> {
    try {
      const data = this.fromRecord(record);
      await this.model.create(data);
      return RepositoryResultHelpers.success(void 0);
    } catch (error) {
      const mongoError = MongoErrorFactory.fromMongoError(error, {
        ...this.context,
        operation: 'insert',
        documentId: record.publicId,
      });
      return RepositoryResultHelpers.failure(mongoError);
    }
  }

  async findByPublicId(publicId: string): Promise<OptionalRepositoryResult<AssetMetadataRecord>> {
    try {
      const doc = await this.model.findOne({ publicId }).exec();
      
      if (!doc) {
        return RepositoryResultHelpers.optionalEmpty();
      }

      return RepositoryResultHelpers.optionalSuccess(this.toRecord(doc));
    } catch (error) {
      const mongoError = MongoErrorFactory.fromMongoError(error, {
        ...this.context,
        operation: 'findByPublicId',
        documentId: publicId,
      });
      return RepositoryResultHelpers.optionalFailure(mongoError);
    }
  }

  async findByContentHash(contentHash: string): Promise<OptionalRepositoryResult<AssetMetadataRecord>> {
    try {
      const doc = await this.model.findOne({ contentHash }).exec();
      
      if (!doc) {
        return RepositoryResultHelpers.optionalEmpty();
      }

      return RepositoryResultHelpers.optionalSuccess(this.toRecord(doc));
    } catch (error) {
      const mongoError = MongoErrorFactory.fromMongoError(error, {
        ...this.context,
        operation: 'findByContentHash',
      });
      return RepositoryResultHelpers.optionalFailure(mongoError);
    }
  }

  async findByIds(publicIds: string[]): Promise<RepositoryResult<AssetMetadataRecord[]>> {
    try {
      const docs = await this.model.find({ 
        publicId: { $in: publicIds } 
      }).exec();

      const records = docs.map(doc => this.toRecord(doc));
      return RepositoryResultHelpers.success(records);
    } catch (error) {
      const mongoError = MongoErrorFactory.fromMongoError(error, {
        ...this.context,
        operation: 'findByIds',
        documentIds: publicIds,
      });
      return RepositoryResultHelpers.failure(mongoError);
    }
  }

  async incrementReferenceCount(publicId: string): Promise<RepositoryResult<void>> {
    try {
      const result = await this.model.findOneAndUpdate(
        { publicId },
        { 
          $inc: { 
            referenceCount: 1,
          } 
        },
        { 
          new: true,
          runValidators: true 
        }
      );

      if (!result) {
        const notFoundError = MongoErrorFactory.notFound({
          ...this.context,
          operation: 'incrementReferenceCount',
        }, publicId);
        return RepositoryResultHelpers.failure(notFoundError);
      }

      return RepositoryResultHelpers.success(void 0);
    } catch (error) {
      const mongoError = MongoErrorFactory.fromMongoError(error, {
        ...this.context,
        operation: 'incrementReferenceCount',
        documentId: publicId,
      });
      return RepositoryResultHelpers.failure(mongoError);
    }
  }

  async decrementReferenceCount(publicId: string): Promise<RepositoryResult<void>> {
    try {
      const asset = await this.model.findOne({ publicId });
      
      if (!asset) {
        const notFoundError = MongoErrorFactory.notFound({
          ...this.context,
          operation: 'decrementReferenceCount',
        }, publicId);
        return RepositoryResultHelpers.failure(notFoundError);
      }

      if (asset.referenceCount <= 0) {
        const validationError = MongoErrorFactory.validation({
          ...this.context,
          operation: 'decrementReferenceCount',
        }, {
          referenceCount: ['Cannot decrement below 0']
        });
        return RepositoryResultHelpers.failure(validationError);
      }

      const result = await this.model.findOneAndUpdate(
        { publicId },
        { 
          $inc: { 
            referenceCount: -1,
          } 
        },
        { 
          new: true,
          runValidators: true 
        }
      );

      if (!result) {
        // Ya no existe
        const notFoundError = MongoErrorFactory.notFound({
          ...this.context,
          operation: 'decrementReferenceCount',
          documentId: publicId,
        });
        return RepositoryResultHelpers.failure(notFoundError);
      }

      return RepositoryResultHelpers.success(void 0);
    } catch (error) {
      const mongoError = MongoErrorFactory.fromMongoError(error, {
        ...this.context,
        operation: 'decrementReferenceCount',
        documentId: publicId,
      });
      return RepositoryResultHelpers.failure(mongoError);
    }
  }

  async deleteByPublicId(publicId: string): Promise<RepositoryResult<void>> {
    try {
      const result = await this.model.findOneAndDelete({ publicId });

      if (!result) {
        const notFoundError = MongoErrorFactory.notFound({
          ...this.context,
          operation: 'deleteByPublicId',
        }, publicId);
        return RepositoryResultHelpers.failure(notFoundError);
      }

      return RepositoryResultHelpers.success(void 0);
    } catch (error) {
      const mongoError = MongoErrorFactory.fromMongoError(error, {
        ...this.context,
        operation: 'deleteByPublicId',
        documentId: publicId,
      });
      return RepositoryResultHelpers.failure(mongoError);
    }
  }
}