// src/media/application/services/asset-id-to-url.service.ts
import { Injectable, Inject } from '@nestjs/common';
import type { IAssetMetadataDao } from '../ports/asset-metadata.dao';
import type { IAssetUrlService } from './asset-url-generator.interface';
import { IAssetIdToUrlService } from './asset-id-to-url.service.interface';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { AssetMetadataUrlService } from './asset-metadata-url.service';

@Injectable()
export class AssetIdToUrlService implements IAssetIdToUrlService {
  constructor(
    @Inject(DaoName.AssetMetadataMongo)
    private readonly metadataDao: IAssetMetadataDao,
    @Inject(AssetMetadataUrlService)
    private readonly urlGenerator: IAssetUrlService,
  ) {}

  async getUrl(assetId: string): Promise<string | null> {
    const urls = await this.getUrls([assetId]);
    return urls.get(assetId) || null;
  }

  async getUrls(assetIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(assetIds.filter(id => id && id.trim() !== ''))];
    
    if (uniqueIds.length === 0) {
      return new Map();
    }

    // 1. Obtener metadata de assets
    const result = await this.metadataDao.findByIds(uniqueIds);
    
    if (result.isLeft()) {
      return new Map();
    }

    const assets = result.getRight();
    
    // 2. Preparar para generación de URLs
    const assetPairs = assets.map(asset => ({
      provider: asset.provider,
      publicId: asset.publicId
    }));

    // 3. Generar URLs
    const urlMap = new Map<string, string>();
    
    if (typeof this.urlGenerator.generateUrls === 'function') {
      // Batch generation
      const batchMap = this.urlGenerator.generateUrls(assetPairs);
      // Mapear publicId a URL
      assets.forEach(asset => {
        const url = batchMap.get(asset.publicId);
        if (url) {
          urlMap.set(asset.publicId, url);
        }
      });
    } else {
      // Individual generation
      for (const asset of assets) {
        try {
          const url = this.urlGenerator.generateUrl(
            asset.provider, 
            asset.publicId
          );
          urlMap.set(asset.publicId, url);
        } catch (error) {
          console.debug(`URL generation failed for ${asset.publicId}`);
        }
      }
    }

    return urlMap;
  }
}