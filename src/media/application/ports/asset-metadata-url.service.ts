// src/media/application/services/asset-metadata-url.service.ts
import { Injectable, Inject } from '@nestjs/common';
import type { IAssetMetadataDao } from '../ports/asset-metadata.dao';
import { CloudinaryUrlGeneratorAdapter } from 'src/media/infraestructure/adapters/cloudinary/cloudinary-url-generator.adapter';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

@Injectable()
export class AssetMetadataUrlService {
  constructor(
    @Inject(DaoName.AssetMetadataMongo)
    private readonly metadataDao: IAssetMetadataDao,
    @Inject(CloudinaryUrlGeneratorAdapter)
    private readonly urlGenerator: CloudinaryUrlGeneratorAdapter,
  ) {}

  /**
   * BATCH MASIVO: Obtiene URLs para muchos assets a la vez
   */
  async getAssetUrls(assetIds: string[]): Promise<Map<string, string>> {
    // 1. Filtrar y deduplicar
    const uniqueIds = [...new Set(assetIds.filter(id => id && id.trim() !== ''))];
    
    if (uniqueIds.length === 0) {
      return new Map();
    }

    // 2. SUPER QUERY: todos los assets en una consulta
    const result = await this.metadataDao.findByIds(uniqueIds);
    
    if (result.isLeft()) {
      return new Map();
    }

    const assets = result.getRight();
    
    // 3. PREPARAR BATCH para URL generation
    const assetPairs = assets.map(asset => ({
      provider: asset.provider,
      publicId: asset.publicId
    }));

    // 4. GENERACIÓN MASIVA de URLs
    if (typeof this.urlGenerator.generateUrls === 'function') {
      // ¡BATCH! Todas las URLs de una
      return this.urlGenerator.generateUrls(assetPairs);
    } else {
      // Fallback: generar una por una (pero al menos la query fue batch)
      const urlMap = new Map<string, string>();
      for (const asset of assets) {
        try {
          const url = this.urlGenerator.generateUrl(asset.provider, asset.publicId);
          urlMap.set(asset.publicId, url);
        } catch (error) {
          // Silencioso, no rompe el flujo
          console.debug(`URL generation failed for ${asset.publicId}`);
        }
      }
      return urlMap;
    }
  }
}