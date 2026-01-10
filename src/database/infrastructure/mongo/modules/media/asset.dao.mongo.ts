/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\modules\media\asset.dao.mongo.ts

// --- NestJS & Mongoose ---
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// --- Tipos Core & Interfaces de Error ---
import { ErrorData, Either, ErrorLayer } from 'src/core/types';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

// --- Tokens de Inyección ---
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';

// --- Application Ports ---
import { IAssetMetadataDao } from 'src/media/application/ports/i-asset-metadata.dao.interface';
import { AssetMetadataRecord } from 'src/media/application/ports/i-asset-metadata-record.interface';

// --- Infrastructure: Entidades, Helpers & Constantes ---
import { AssetMetadata } from '../../entities/asset.schema';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';
import { ASSET_MONGO_BASE } from './constants/asset-mongo-constants';

// --- Infrastructure: Decoradores & Catálogos ---
import { DaoMongo } from '../../decorators/dao-mongo.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';


/**
 * Interfaz que representa el POJO devuelto por .lean().
 * Mapea exactamente los campos obligatorios del Schema.
 */
export interface IAssetMetadataDocument {
  assetId: string;
  publicId: string;
  provider: string;
  originalName: string;
  mimeType: string;
  size: number;
  contentHash: string;
  referenceCount: number;
  format: string;
  category: string;
  theme: boolean;
  uploadedAt: Date;
}

@DaoMongo(DaoName.AssetMetadata)
@Injectable()
export class AssetMetadataMongoDao implements IAssetMetadataDao {
  private readonly contextBase = ASSET_MONGO_BASE;
  private readonly adapterName = AssetMetadataMongoDao.name;
  private readonly portName = 'IAssetMetadataDao';

  constructor(
    @InjectModel(AssetMetadata.name)
    private readonly model: Model<AssetMetadata>,
    @Inject(ERROR_TOKENS.MAPPERS.MONGO)
    private readonly mongoErrorMapper: IErrorMapper<unknown, IDatabaseErrorContext>,
  ) {}

  /**
   * Genera el contexto de error inyectando la identidad del DAO y el registro afectado.
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

  /**
   * Mapea el documento plano de MongoDB al Record de la capa de aplicación.
   */
  private toRecord(doc: IAssetMetadataDocument): AssetMetadataRecord {
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

  // --- MÉTODOS DE ESCRITURA ---

  async insert(record: AssetMetadataRecord): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('insert', record.publicId);
    const result = await Either.tryCatch(
      this.model.create(record),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );
    return result.map(() => undefined);
  }

  async incrementReferenceCount(publicId: string): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('incrementReferenceCount', publicId);
    const result = await Either.tryCatch(
      this.model.findOneAndUpdate(
        { publicId },
        { $inc: { referenceCount: 1 } },
        { new: true }
      ).lean<IAssetMetadataDocument>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    return result.chain((doc) => 
      doc ? Either.makeRight(undefined) 
          : Either.makeLeft(new ErrorData("RESOURCE_NOT_FOUND", `Asset ${publicId} not found`, ErrorLayer.INFRASTRUCTURE, ctx))
    );
  }

  async decrementReferenceCount(publicId: string): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('decrementReferenceCount', publicId);
    
    // 1. Buscar y validar
    const findResult = await Either.tryCatch(
      this.model.findOne({ publicId }).lean<IAssetMetadataDocument>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    if (findResult.isLeft()) return Either.makeLeft(findResult.getLeft());
    const asset = findResult.getRight();

    if (!asset) {
      return Either.makeLeft(new ErrorData("RESOURCE_NOT_FOUND", `Asset ${publicId} not found`, ErrorLayer.INFRASTRUCTURE, ctx));
    }

    if (asset.referenceCount <= 0) {
      return Either.makeLeft(new ErrorData(
        "REFERENCE_COUNT_INVALID", 
        "Cannot decrement below zero", 
        ErrorLayer.INFRASTRUCTURE, 
        { ...ctx, currentValue: asset.referenceCount }
      ));
    }

    // 2. Ejecutar actualización
    const updateResult = await Either.tryCatch(
      this.model.updateOne({ publicId }, { $inc: { referenceCount: -1 } }).exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    return updateResult.map(() => undefined);
  }

  async deleteByPublicId(publicId: string): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('deleteByPublicId', publicId);
    const result = await Either.tryCatch(
      this.model.findOneAndDelete({ publicId }).lean<IAssetMetadataDocument>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    return result.chain((doc) => 
      doc ? Either.makeRight(undefined) 
          : Either.makeLeft(new ErrorData("RESOURCE_NOT_FOUND", `Asset ${publicId} not found`, ErrorLayer.INFRASTRUCTURE, ctx))
    );
  }

  // --- MÉTODOS DE LECTURA ---

  async findByPublicId(publicId: string): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const ctx = this.getCtx('findByPublicId', publicId);
    const result = await Either.tryCatch(
      this.model.findOne({ publicId }).lean<IAssetMetadataDocument>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );
    return result.map((doc) => (doc ? this.toRecord(doc) : null));
  }

  async findByAssetId(id: string): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const ctx = this.getCtx('findByAssetId', id);
    const result = await Either.tryCatch(
      this.model.findOne({ assetId: id }).lean<IAssetMetadataDocument>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );
    return result.map((doc) => (doc ? this.toRecord(doc) : null));
  }

  async findByContentHash(contentHash: string): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const ctx = this.getCtx('findByContentHash', contentHash);
    const result = await Either.tryCatch(
      this.model.findOne({ contentHash }).lean<IAssetMetadataDocument>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );
    return result.map((doc) => (doc ? this.toRecord(doc) : null));
  }

  async findByIds(assetIds: string[]): Promise<Either<ErrorData, AssetMetadataRecord[]>> {
    const ctx = this.getCtx('findByIds');
    const result = await Either.tryCatch(
      this.model.find({ assetId: { $in: assetIds } }).lean<IAssetMetadataDocument[]>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );
    return result.map((docs) => docs.map((doc) => this.toRecord(doc)));
  }

  async findThemeById(assetId: string): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const ctx = this.getCtx('findThemeById', assetId);
    const result = await Either.tryCatch(
      this.model.findOne({ assetId, theme: true }).lean<IAssetMetadataDocument>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );
    return result.map((doc) => (doc ? this.toRecord(doc) : null));
  }

  async findThemes(options?: { category?: string; format?: string; mimeType?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<Either<ErrorData, AssetMetadataRecord[]>> {
    const ctx = this.getCtx('findThemes');
    const result = await Either.tryCatch(
      this.buildThemesQuery(options).lean<IAssetMetadataDocument[]>().exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );
    return result.map(docs => docs.map(doc => this.toRecord(doc)));
  }

  private buildThemesQuery(options?: { category?: string; format?: string; mimeType?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const filter: Record<string, unknown> = { theme: true };
    if (options?.category) filter.category = options.category;
    if (options?.format) filter.format = options.format;
    if (options?.mimeType) filter.mimeType = options.mimeType;

    const dbQuery = this.model.find(filter);
    const sortBy = options?.sortBy || 'uploadedAt';
    const sortOrder = options?.sortOrder === 'asc' ? 1 : -1;
    
    dbQuery.sort({ [sortBy]: sortOrder });
    if (options?.offset) dbQuery.skip(options.offset);
    if (options?.limit) dbQuery.limit(options.limit);

    return dbQuery;
  }
}