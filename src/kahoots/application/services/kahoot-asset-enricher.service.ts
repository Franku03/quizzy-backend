// src/kahoots/application/services/kahoot-asset-enricher.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { KahootHandlerResponse } from '../response/kahoot.handler.response';
import type { IAssetIdToUrlService } from 'src/media/application/ports/asset-id-to-url.service.interface';
import { ASSET_ID_TO_URL_SERVICE } from 'src/media/application/dependecy-tokkens/application-media.tokens';

@Injectable()
export class KahootAssetEnricherService {
  constructor(
    @Inject(ASSET_ID_TO_URL_SERVICE)
    private readonly assetIdToUrlService: IAssetIdToUrlService
  ) {}

  public async enrich(kahootResponse: KahootHandlerResponse): Promise<KahootHandlerResponse> {
    const mediaIds = this.extractAllMediaIds(kahootResponse);
    
    if (mediaIds.length === 0) {
      return kahootResponse;
    }

    const urlMap = await this.assetIdToUrlService.getUrls(mediaIds);
    this.mutateKahootWithUrls(kahootResponse, urlMap);

    return kahootResponse;
  }

  public async enrichMultiple(kahootResponses: KahootHandlerResponse[]): Promise<KahootHandlerResponse[]> {
    const allMediaIds = new Set<string>();
    for (const kahoot of kahootResponses) {
      const ids = this.extractAllMediaIds(kahoot);
      ids.forEach(id => allMediaIds.add(id));
    }

    if (allMediaIds.size === 0) {
      return kahootResponses;
    }

    const urlMap = await this.assetIdToUrlService.getUrls(Array.from(allMediaIds));

    for (const kahoot of kahootResponses) {
      this.mutateKahootWithUrls(kahoot, urlMap);
    }

    return kahootResponses;
  }

  private extractAllMediaIds(kahootResponse: KahootHandlerResponse): string[] {
    const mediaIds: string[] = [];

    if (kahootResponse.coverImageId) {
      mediaIds.push(kahootResponse.coverImageId);
    }

    if (kahootResponse.questions) {
      for (const slide of kahootResponse.questions) {
        if (slide.mediaId) {
          mediaIds.push(slide.mediaId);
        }

        if (slide.answers) {
          for (const option of slide.answers) {
            if (option.mediaId) {
              mediaIds.push(option.mediaId);
            }
          }
        }
      }
    }

    return mediaIds;
  }

  private mutateKahootWithUrls(
    kahoot: KahootHandlerResponse,
    urlMap: Map<string, string>
  ): void {
    if (kahoot.coverImageId && urlMap.has(kahoot.coverImageId)) {
      kahoot.coverImageId = urlMap.get(kahoot.coverImageId)!;
    }

    if (kahoot.questions) {
      for (const slide of kahoot.questions) {
        if (slide.mediaId && urlMap.has(slide.mediaId)) {
          slide.mediaId = urlMap.get(slide.mediaId)!;
        }

        if (slide.answers) {
          for (const option of slide.answers) {
            if (option.mediaId && urlMap.has(option.mediaId)) {
              option.mediaId = urlMap.get(option.mediaId)!;
            }
          }
        }
      }
    }
  }
}