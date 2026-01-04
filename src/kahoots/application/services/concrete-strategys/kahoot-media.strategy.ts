// src/kahoots/application/strategies/kahoot-media.strategy.ts
import { Injectable, Inject } from '@nestjs/common';
import { IMediaStrategy } from '../../ports/i-media-strategy.interface';
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import type { IAssetMetadataDao } from 'src/media/application/ports/asset-metadata.dao';

@Injectable()
export class KahootMediaStrategy implements IMediaStrategy<KahootHandlerResponse> {
  
  constructor(
    @Inject(DaoName.AssetMetadataMongo)
    private readonly metadataDao: IAssetMetadataDao
  ) {}

  extractMediaIds(kahoot: KahootHandlerResponse): string[] {
    const mediaIds: string[] = [];
    
    // 1. Extraer ID del tema y cover
    if (kahoot.themeId) mediaIds.push(kahoot.themeId);
    if (kahoot.coverImageId) mediaIds.push(kahoot.coverImageId);

    // 2. Extraer de preguntas y opciones
    if (kahoot.questions) {
      for (const slide of kahoot.questions) {
        if (slide.mediaId) mediaIds.push(slide.mediaId);
        if (slide.answers) {
          for (const option of slide.answers) {
            if (option.mediaId) mediaIds.push(option.mediaId);
          }
        }
      }
    }
    return mediaIds;
  }

  async replaceWithUrls(kahoot: KahootHandlerResponse, urlMap: Map<string, string>): Promise<void> {
    //Enriquecer el THEME como objeto
    if (kahoot.themeId && urlMap.has(kahoot.themeId)) {
      const themeData = await this.metadataDao.findThemeById(kahoot.themeId);
      const themeRecord = themeData.isRight() ? themeData.getRight() : null;

      kahoot.theme = {
        id: kahoot.themeId,
        url: urlMap.get(kahoot.themeId)!,
        name: themeRecord?.originalName || ''
      };
      
      // Borramos la propiedad temporal para que no salga en el JSON final
      delete kahoot.themeId; 
    }

    //Reemplazar Cover Image (URL plana)
    if (kahoot.coverImageId && urlMap.has(kahoot.coverImageId)) {
      kahoot.coverImageId = urlMap.get(kahoot.coverImageId)!;
    }

    //Reemplazar Media en Questions y Options (URL plana)
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