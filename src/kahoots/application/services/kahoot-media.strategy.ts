// src/kahoots/application/strategies/kahoot-media.strategy.ts
import { Injectable } from '@nestjs/common';
import { IMediaStrategy } from '../ports/i-media-strategy.interface';
import { KahootHandlerResponse } from '../response/kahoot.handler.response';

@Injectable()
export class KahootMediaStrategy implements IMediaStrategy<KahootHandlerResponse> {
  extractMediaIds(kahoot: KahootHandlerResponse): string[] {
    const mediaIds: string[] = [];
    
    // Cover del kahoot
    if (kahoot?.coverImageId) {
      mediaIds.push(kahoot.coverImageId);
    }

    // Media de slides y opciones
    if (kahoot?.questions) {
      for (const slide of kahoot.questions) {
        if (slide?.mediaId) {
          mediaIds.push(slide.mediaId);
        }

        // Media de las opciones dentro del slide
        if (slide?.answers) {
          for (const option of slide.answers) {
            if (option?.mediaId) {
              mediaIds.push(option.mediaId);
            }
          }
        }
      }
    }

    return mediaIds;
  }

  replaceWithUrls(kahoot: KahootHandlerResponse, urlMap: Map<string, string>): void {
    // Reemplazar cover
    if (kahoot?.coverImageId && urlMap.has(kahoot.coverImageId)) {
      kahoot.coverImageId = urlMap.get(kahoot.coverImageId)!;
    }

    // Reemplazar media de slides y opciones
    if (kahoot?.questions) {
      for (const slide of kahoot.questions) {
        if (slide?.mediaId && urlMap.has(slide.mediaId)) {
          slide.mediaId = urlMap.get(slide.mediaId)!;
        }

        if (slide?.answers) {
          for (const option of slide.answers) {
            if (option?.mediaId && urlMap.has(option.mediaId)) {
              option.mediaId = urlMap.get(option.mediaId)!;
            }
          }
        }
      }
    }
  }
}