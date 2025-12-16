// src/kahoots/application/strategies/slide-media.strategy.ts
import { Injectable } from '@nestjs/common';
import { IMediaStrategy } from '../ports/i-media-strategy.interface';
import { SlideHandlerResponse } from '../response/kahoot.slide.handler.response';

@Injectable()
export class SlideMediaStrategy implements IMediaStrategy<SlideHandlerResponse> {
  extractMediaIds(slide: SlideHandlerResponse): string[] {
    const mediaIds: string[] = [];
    
    // Media del slide
    if (slide?.mediaId) {
      mediaIds.push(slide.mediaId);
    }

    // Media de las opciones
    if (slide?.answers) {
      for (const option of slide.answers) {
        if (option?.mediaId) {
          mediaIds.push(option.mediaId);
        }
      }
    }

    return mediaIds;
  }

  replaceWithUrls(slide: SlideHandlerResponse, urlMap: Map<string, string>): void {
    // Reemplazar media del slide
    if (slide?.mediaId && urlMap.has(slide.mediaId)) {
      slide.mediaId = urlMap.get(slide.mediaId)!;
    }

    // Reemplazar media de las opciones
    if (slide?.answers) {
      for (const option of slide.answers) {
        if (option?.mediaId && urlMap.has(option.mediaId)) {
          option.mediaId = urlMap.get(option.mediaId)!;
        }
      }
    }
  }
}