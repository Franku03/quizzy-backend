// src/kahoots/application/strategies/option-media.strategy.ts
import { Injectable } from '@nestjs/common';
import { IMediaStrategy } from '../ports/i-media-strategy.interface';
import { OptionHandlerResponse } from '../response/kahoot.slide.option.handler.response';

@Injectable()
export class OptionMediaStrategy implements IMediaStrategy<OptionHandlerResponse> {
  extractMediaIds(option: OptionHandlerResponse): string[] {
    const mediaIds: string[] = [];
    
    // Media de la opción
    if (option?.mediaId) {
      mediaIds.push(option.mediaId);
    }

    return mediaIds;
  }

  replaceWithUrls(option: OptionHandlerResponse, urlMap: Map<string, string>): void {
    // Reemplazar media de la opción
    if (option?.mediaId && urlMap.has(option.mediaId)) {
      option.mediaId = urlMap.get(option.mediaId)!;
    }
  }
}