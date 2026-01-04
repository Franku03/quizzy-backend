// src/media/infrastructure/persistence/mongo/asset-metadata.mongo-dao.ts
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IAssetMetadataDao } from 'src/media/application/ports/i-asset-metadata.dao.interface';
import { AssetMetadataRecord } from 'src/media/application/ports/i-asset-metadata-record.interface';
import { ErrorData, Either, ErrorLayer } from 'src/core/types';
import { AssetMetadataMongo } from '../../entities/media.schema';
import { MongoErrorMapper } from '../../errors/mongo-error.mapper';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import { DaoMongo } from '../../decorators/dao-mongo.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

@DaoMongo(DaoName.AssetMetadataMongo)
@Injectable()
export class AssetMetadataMongoDao implements IAssetMetadataDao {

  private readonly adapterContextBase: IDatabaseErrorContext = {
    adapterName: AssetMetadataMongoDao.name,
    portName: 'IAssetMetadataDao',
    module: 'media',
    databaseType: 'mongodb',
    collectionOrTable: 'asset_metadata',
    operation: '',
  } as const;

  private readonly mongoErrorMapper: MongoErrorMapper = new MongoErrorMapper();

  constructor(
    @InjectModel(AssetMetadataMongo.name)
    private readonly model: Model<AssetMetadataMongo>,
  ) { }

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
      theme: doc.theme,
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
      theme: record.theme,
      uploadedAt: record.uploadedAt,
    };
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
      return Either.makeRight(undefined);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft(errorData);
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
      return Either.makeRight(doc ? this.toRecord(doc) : null);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft(errorData);
    }
  }

  async findByAssetId(id: string): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'findByPublicId',
      entityId: id,
    };

    try {
      const doc = await this.model.findOne({ assetId: id }).exec();
      return Either.makeRight(doc ? this.toRecord(doc) : null);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft(errorData);
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
      return Either.makeRight(doc ? this.toRecord(doc) : null);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft(errorData);
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
      return Either.makeRight(records);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft(errorData);
    }
  }

  async findThemeById(assetId: string): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'findTheme',
      entityId: assetId,
    };

    try {
      // Buscamos estrictamente por el UUID de assetId y que sea un tema
      const doc = await this.model.findOne({
        assetId: assetId,
        theme: true
      }).exec();

      return Either.makeRight(doc ? this.toRecord(doc) : null);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft(errorData);
    }
  }

  async findThemes(options?: {
    category?: string;
    format?: string;
    mimeType?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'uploadedAt' | 'size' | 'originalName';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Either<ErrorData, AssetMetadataRecord[]>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'findThemes',
    };

    try {
      // Construir query base
      const query: any = { theme: true };

      // Aplicar filtros opcionales
      if (options?.category) query.category = options.category;
      if (options?.format) query.format = options.format;
      if (options?.mimeType) query.mimeType = options.mimeType;

      // Construir consulta
      let dbQuery = this.model.find(query);

      // Aplicar sorting (por defecto: uploadedAt descendente)
      const sortBy = options?.sortBy || 'uploadedAt';
      const sortOrder = options?.sortOrder === 'asc' ? 1 : -1;
      dbQuery = dbQuery.sort({ [sortBy]: sortOrder });

      // Aplicar paginación
      if (options?.offset && options.offset > 0) {
        dbQuery = dbQuery.skip(options.offset);
      }

      if (options?.limit && options.limit > 0) {
        dbQuery = dbQuery.limit(options.limit);
      }

      // Ejecutar consulta
      const docs = await dbQuery.exec();
      const records = docs.map(doc => this.toRecord(doc));

      return Either.makeRight(records);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft(errorData);
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
        { new: true }
      );

      if (!result) {
        const notFoundError = new ErrorData(
          "RESOURCE_NOT_FOUND",
          `Asset metadata with publicId '${publicId}' not found.`,
          ErrorLayer.INFRASTRUCTURE,
          fullContext
        );
        return Either.makeLeft(notFoundError);
      }

      return Either.makeRight(undefined);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft(errorData);
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
          `Asset metadata with publicId '${publicId}' not found.`,
          ErrorLayer.INFRASTRUCTURE,
          fullContext
        );
        return Either.makeLeft(notFoundError);
      }

      if (asset.referenceCount <= 0) {
        const validationError = new ErrorData(
          "REFERENCE_COUNT_INVALID",
          'Cannot decrement reference count below zero.',
          ErrorLayer.INFRASTRUCTURE,
          { ...fullContext, currentValue: asset.referenceCount }
        );
        return Either.makeLeft(validationError);
      }

      await this.model.updateOne(
        { publicId },
        { $inc: { referenceCount: -1 } }
      );

      return Either.makeRight(undefined);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft(errorData);
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
          `Asset metadata with publicId '${publicId}' not found.`,
          ErrorLayer.INFRASTRUCTURE,
          fullContext
        );
        return Either.makeLeft(notFoundError);
      }

      return Either.makeRight(undefined);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft(errorData);
    }
  }
}