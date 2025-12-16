// src/kahoots/application/services/media-enricher.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { IMediaEnricher } from '../ports/i-media-enricher.interface';
import type { IMediaStrategy } from '../ports/i-media-strategy.interface';
import type { IAssetIdToUrlService } from 'src/media/application/ports/asset-id-to-url.service.interface';
import { ASSET_ID_TO_URL_SERVICE } from 'src/media/application/dependecy-tokkens/application-media.tokens';

@Injectable()
export class MediaEnricher<T> implements IMediaEnricher<T> {
  constructor(
    @Inject(ASSET_ID_TO_URL_SERVICE)
    private readonly assetIdToUrlService: IAssetIdToUrlService,
    private readonly strategy: IMediaStrategy<T>
  ) {}

  public async enrich(target: T): Promise<T> {
    const mediaIds = this.strategy.extractMediaIds(target);
    
    if (mediaIds.length === 0) {
      return target;
    }

    const urlMap = await this.assetIdToUrlService.getUrls(mediaIds);
    this.strategy.replaceWithUrls(target, urlMap);
    
    return target;
  }

  public async enrichMany(targets: T[]): Promise<T[]> {
    const allMediaIds = new Set<string>();
    
    // Extraer todos los IDs de todos los objetos
    for (const target of targets) {
      const ids = this.strategy.extractMediaIds(target);
      ids.forEach(id => allMediaIds.add(id));
    }

    if (allMediaIds.size === 0) {
      return targets;
    }

    // Obtener todas las URLs en batch
    const urlMap = await this.assetIdToUrlService.getUrls(Array.from(allMediaIds));

    // Reemplazar URLs en todos los objetos
    for (const target of targets) {
      this.strategy.replaceWithUrls(target, urlMap);
    }

    return targets;
  }
}