/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\media\asset.pg.dao.ts

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

// --- Core Logic & Types ---
import { ErrorData, Either, ErrorLayer } from 'src/core/types';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';

// --- Application Ports ---
import { IAssetMetadataDao } from 'src/media/application/ports/i-asset-metadata.dao.interface';
import { AssetMetadataRecord } from 'src/media/application/ports/i-asset-metadata-record.interface';

// --- Infrastructure: Entities & Constants ---
import { AssetMetadataEntity } from '../../entities/asset.entity.pg';
import { ASSET_POSTGRES_BASE } from './constants/asset.pg-constants';

// --- Infrastructure: Decoradores & Mappers ---
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { DaoPostgres } from '../../decorators/dao-postgres.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

interface FindThemesOptions {
  category?: string;
  format?: string;
  mimeType?: string;
  sortBy?: string;
  sortOrder?: string;
  offset?: number;
  limit?: number;
}

@DaoPostgres(DaoName.AssetMetadata)
@Injectable()
export class AssetMetadataDao implements IAssetMetadataDao {
  private readonly contextBase = ASSET_POSTGRES_BASE;
  private readonly adapterName = AssetMetadataDao.name;
  private readonly portName = 'IAssetMetadataDao';

  constructor(
    @InjectRepository(AssetMetadataEntity)
    private readonly repo: Repository<AssetMetadataEntity>,
    @Inject(ERROR_TOKENS.MAPPERS.POSTGRES)
    private readonly pgErrorMapper: IErrorMapper<
      unknown,
      IDatabaseErrorContext
    >,
  ) {}

  private getCtx(
    operation: string,
    entityId?: string,
    extra?: Record<string, unknown>,
  ) {
    return createDatabaseContext(
      this.contextBase,
      this.adapterName,
      this.portName,
      operation,
      entityId,
      extra,
    );
  }

  private toRecord(entity: AssetMetadataEntity): AssetMetadataRecord {
    return {
      assetId: entity.assetId,
      publicId: entity.publicId,
      provider: entity.provider,
      originalName: entity.originalName,
      mimeType: entity.mimeType,
      size: entity.size,
      contentHash: entity.contentHash,
      referenceCount: entity.referenceCount,
      format: entity.format,
      category: entity.category,
      theme: entity.theme,
      uploadedAt: entity.uploadedAt,
    };
  }

  async insert(record: AssetMetadataRecord): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('insert', record.publicId);
    const result = await Either.tryCatch(
      this.repo.save(this.repo.create(record)),
      (err) => this.pgErrorMapper.toErrorData(err, ctx),
    );
    return result.map(() => undefined);
  }

  async incrementReferenceCount(
    publicId: string,
  ): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('incrementReferenceCount', publicId);
    const result = await Either.tryCatch(
      this.repo.increment({ publicId }, 'referenceCount', 1),
      (err) => this.pgErrorMapper.toErrorData(err, ctx),
    );
    return result.chain((res) =>
      res.affected && res.affected > 0
        ? Either.makeRight(undefined)
        : Either.makeLeft(
            new ErrorData(
              'RESOURCE_NOT_FOUND',
              `Asset ${publicId} not found`,
              ErrorLayer.INFRASTRUCTURE,
              ctx,
            ),
          ),
    );
  }

  async decrementReferenceCount(
    publicId: string,
  ): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('decrementReferenceCount', publicId);
    const entity = await this.repo.findOneBy({ publicId });
    if (!entity)
      return Either.makeLeft(
        new ErrorData(
          'RESOURCE_NOT_FOUND',
          `Asset ${publicId} not found`,
          ErrorLayer.INFRASTRUCTURE,
          ctx,
        ),
      );
    if (entity.referenceCount <= 0)
      return Either.makeLeft(
        new ErrorData(
          'REFERENCE_COUNT_INVALID',
          'Cannot decrement below zero',
          ErrorLayer.INFRASTRUCTURE,
          { ...ctx, currentValue: entity.referenceCount },
        ),
      );

    const result = await Either.tryCatch(
      this.repo.decrement({ publicId }, 'referenceCount', 1),
      (err) => this.pgErrorMapper.toErrorData(err, ctx),
    );
    return result.map(() => undefined);
  }

  async deleteByPublicId(publicId: string): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('deleteByPublicId', publicId);
    const result = await Either.tryCatch(
      this.repo.delete({ publicId }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx),
    );
    return result.chain((res) =>
      res.affected && res.affected > 0
        ? Either.makeRight(undefined)
        : Either.makeLeft(
            new ErrorData(
              'RESOURCE_NOT_FOUND',
              `Asset ${publicId} not found`,
              ErrorLayer.INFRASTRUCTURE,
              ctx,
            ),
          ),
    );
  }

  async findByPublicId(
    publicId: string,
  ): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const ctx = this.getCtx('findByPublicId', publicId);
    const result = await Either.tryCatch(
      this.repo.findOneBy({ publicId }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx),
    );
    return result.map((entity) => (entity ? this.toRecord(entity) : null));
  }

  async findByAssetId(
    id: string,
  ): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const ctx = this.getCtx('findByAssetId', id);
    const result = await Either.tryCatch(
      this.repo.findOneBy({ assetId: id }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx),
    );
    return result.map((entity) => (entity ? this.toRecord(entity) : null));
  }

  async findByContentHash(
    contentHash: string,
  ): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const ctx = this.getCtx('findByContentHash', contentHash);
    const result = await Either.tryCatch(
      this.repo.findOneBy({ contentHash }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx),
    );
    return result.map((entity) => (entity ? this.toRecord(entity) : null));
  }

  async findByIds(
    assetIds: string[],
  ): Promise<Either<ErrorData, AssetMetadataRecord[]>> {
    const ctx = this.getCtx('findByIds');
    const result = await Either.tryCatch(
      this.repo.findBy({ assetId: In(assetIds) }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx),
    );
    return result.map((entities) =>
      entities.map((entity) => this.toRecord(entity)),
    );
  }

  async findThemeById(
    assetId: string,
  ): Promise<Either<ErrorData, AssetMetadataRecord | null>> {
    const ctx = this.getCtx('findThemeById', assetId);
    const result = await Either.tryCatch(
      this.repo.findOneBy({ assetId, theme: true }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx),
    );
    return result.map((entity) => (entity ? this.toRecord(entity) : null));
  }

  async findThemes(
    options?: FindThemesOptions,
  ): Promise<Either<ErrorData, AssetMetadataRecord[]>> {
    const ctx = this.getCtx('findThemes');
    const query = this.repo
      .createQueryBuilder('asset')
      .where('asset.theme = :theme', { theme: true });

    if (options?.category)
      query.andWhere('asset.category = :category', {
        category: options.category,
      });
    if (options?.format)
      query.andWhere('asset.format = :format', { format: options.format });
    if (options?.mimeType)
      query.andWhere('asset.mimeType = :mimeType', {
        mimeType: options.mimeType,
      });

    const sortBy = options?.sortBy ?? 'uploadedAt';
    const sortOrder =
      options?.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query.orderBy(`asset.${sortBy}`, sortOrder);

    if (options?.offset !== undefined) query.offset(options.offset);
    if (options?.limit !== undefined) query.limit(options.limit);

    const result = await Either.tryCatch(query.getMany(), (err) =>
      this.pgErrorMapper.toErrorData(err, ctx),
    );
    return result.map((entities) =>
      entities.map((entity) => this.toRecord(entity)),
    );
  }
}
