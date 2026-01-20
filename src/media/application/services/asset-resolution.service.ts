/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\services\asset-resolution.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import { Either, ErrorData } from 'src/core/types';
import { MEDIA_TOKENS } from '../dependency-tokens/application-media.tokens';
import { AssetMetadataRecord } from '../ports/i-asset-metadata-record.interface';
import type { IAssetMetadataDao } from '../ports/i-asset-metadata.dao.interface';
import type { IAssetUrlGenerator } from '../ports/i-asset-url-generator.interface';
import { IImageUrlEnricher } from '../ports/i-image-url-enricher.interface';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

@Injectable()
export class AssetResolutionService implements IImageUrlEnricher {
  constructor(
    @Inject(DaoName.AssetMetadata)
    private readonly mediaDao: IAssetMetadataDao,

    @Inject(MEDIA_TOKENS.ASSET_URL_GENERATOR)
    private readonly urlGenerator: IAssetUrlGenerator,
  ) {}

  async resolveUrlsBatch(
    assetIds: string[],
  ): Promise<Either<ErrorData, Map<string, string>>> {
    return pipeAsync<ErrorData, Map<string, string>>(
      Either.makeRight<ErrorData, string[]>(assetIds),

      (e: Either<ErrorData, string[]>) =>
        e.map((ids) => [...new Set(ids.filter((id) => !!id))]),

      (e: Either<ErrorData, string[]>) =>
        e.chainAsync(async (uniqueIds: string[]) => {
          if (uniqueIds.length === 0) {
            return Either.makeRight<ErrorData, AssetMetadataRecord[]>([]);
          }
          return await this.mediaDao.findByIds(uniqueIds);
        }),

      (e: Either<ErrorData, AssetMetadataRecord[]>) =>
        e.map((records) => this.buildUrlMap(records)),
    );
  }

  private buildUrlMap(records: AssetMetadataRecord[]): Map<string, string> {
    const finalMap = new Map<string, string>();
    if (records.length === 0) return finalMap;

    const publicIds = records.map((r) => r.publicId);
    const publicIdToUrlMap = this.urlGenerator.generateUrls(publicIds);

    records.forEach((record) => {
      const url = publicIdToUrlMap.get(record.publicId);
      if (url) {
        finalMap.set(record.assetId, url);
      }
    });

    return finalMap;
  }
}
