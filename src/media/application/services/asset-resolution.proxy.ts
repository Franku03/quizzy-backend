/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\services\asset-resolution.proxy.ts

import { Injectable, Inject } from '@nestjs/common';
import { Either, ErrorData } from 'src/core/types';
import { MEDIA_TOKENS } from '../dependency-tokens/application-media.tokens';
import type { IImageUrlEnricher } from '../ports/i-image-url-enricher.interface';

@Injectable()
export class AssetResolutionProxy implements IImageUrlEnricher {
  private readonly urlCache = new Map<string, string>();
  private readonly MAX_CACHE_SIZE = 10000;

  constructor(
    @Inject(MEDIA_TOKENS.RAW_IMAGE_URL_ENRICHER)
    private readonly decoratee: IImageUrlEnricher,
  ) {}

  async resolveUrlsBatch(
    assetIds: string[],
  ): Promise<Either<ErrorData, Map<string, string>>> {
    const finalMap = new Map<string, string>();
    const missingIds: string[] = [];

    // 1. Intentar recuperar de memoria
    assetIds.forEach((id) => {
      const cachedUrl = this.urlCache.get(id);
      if (cachedUrl) {
        finalMap.set(id, cachedUrl);
      } else {
        missingIds.push(id);
      }
    });

    if (missingIds.length === 0) return Either.makeRight(finalMap);

    // 2. MISS: Delegar al service real
    const result = await this.decoratee.resolveUrlsBatch(missingIds);

    return result.map((newUrls) => {
      newUrls.forEach((url, id) => {
        this.applyEvictionPolicy();
        this.urlCache.set(id, url);
        finalMap.set(id, url);
      });

      return finalMap;
    });
  }

  /**
   * Implementa una política de evicción FIFO (First-In, First-Out).
   */
  private applyEvictionPolicy(): void {
    if (this.urlCache.size >= this.MAX_CACHE_SIZE) {
      const iterator = this.urlCache.keys();
      const firstResult = iterator.next();

      const oldestKey = firstResult.value as string | undefined;

      if (oldestKey !== undefined) {
        this.urlCache.delete(oldestKey);
      }
    }
  }
}
