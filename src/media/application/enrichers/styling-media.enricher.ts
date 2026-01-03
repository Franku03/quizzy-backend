// src/media/application/enrichers/styling-media.enricher.ts
import { Injectable, Inject } from "@nestjs/common";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.styling";
import { IMediaEnricher } from "../ports/i-media-enricher.interface";
import type { IThemeEnricher } from "../ports/i-theme-enricher.interface";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";

@Injectable()
export class StylingMediaEnricher implements IMediaEnricher<KahootStylingSnapshot> {
  constructor(
    @Inject(MEDIA_TOKENS.THEME_ENRICHER)
    private readonly themeEnricher: IThemeEnricher
  ) {}

  // Retorna Promise (válido por la interfaz T | Promise<T>)
  async enrich(styling: KahootStylingSnapshot, urlMap: Map<string, string>): Promise<KahootStylingSnapshot> {
    
    // 1. Cover Image (Sync - viene del mapa)
    if (styling.imageId) {
      const url = urlMap.get(styling.imageId);
      if (url) {
        styling.imageId = url;
      }
    }

    // 2. Theme Object (Async - va al ThemeEnricher)
    if (styling.themeId) {
      const result = await this.themeEnricher.enrichTheme(styling.themeId);
      
      if (result.isRight()) {
        const themeObj = result.getRight();
        if (themeObj) {
            styling.theme = themeObj;
        }
      }
    }

    return styling;
  }
}