import { Injectable, Inject } from "@nestjs/common";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { Either, ErrorData } from "src/core/types";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import { AssetMetadataRecord } from "../ports/i-asset-metadata-record.interface";
import type { IAssetMetadataDao } from "../ports/i-asset-metadata.dao.interface";
import type { IAssetUrlGenerator } from "../ports/i-asset-url-generator.interface";
import { IImageUrlEnricher } from "../ports/i-image-url-enricher.interface";
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";

@Injectable()
export class AssetResolutionService implements IImageUrlEnricher {
  constructor(
    @Inject(DaoName.AssetMetadataMongo)
    private readonly mediaDao: IAssetMetadataDao,
    
    @Inject(MEDIA_TOKENS.ASSET_URL_GENERATOR)
    private readonly urlGenerator: IAssetUrlGenerator,
  ) {}

  async resolveUrlsBatch(assetIds: string[]): Promise<Either<ErrorData, Map<string, string>>> {
    return pipeAsync(

      Either.makeRight<ErrorData, string[]>(assetIds),

      (e) => e.map(ids => [...new Set(ids.filter(id => !!id))]),

      (e) => e.chainAsync(uniqueIds => {
        if (uniqueIds.length === 0) {
            return Promise.resolve(
                Either.makeRight<ErrorData, AssetMetadataRecord[]>([])
            ); 
        }
        return this.mediaDao.findByIds(uniqueIds);
      }),

      (e) => e.map(records => this.buildUrlMap(records))
    );
  }

  private buildUrlMap(records: AssetMetadataRecord[]): Map<string, string> {
    const finalMap = new Map<string, string>();
    if (!records || records.length === 0) return finalMap;

    const publicIds = records.map(r => r.publicId);
    const publicIdToUrlMap = this.urlGenerator.generateUrls(publicIds);

    records.forEach(record => {
      const url = publicIdToUrlMap.get(record.publicId);
      if (url) {
        finalMap.set(record.assetId, url);
      }
    });

    return finalMap;
  }
}