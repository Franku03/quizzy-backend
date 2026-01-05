// src/media/application/handlers/theme-enrichment.handler.ts
import { Injectable, Scope, Inject } from "@nestjs/common"; //
import { IThemeable } from "src/core/domain/abstractions/themeable.interface"; 
import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import type { IThemeEnricher } from "../ports/i-theme-enricher.interface"; 
import { MediaEnrichmentHandler } from "./media-enrichment.handler"; 

@Injectable({ scope: Scope.TRANSIENT }) 
export class ThemeEnrichmentHandler<T extends IThemeable & IHasMediaAssets> extends MediaEnrichmentHandler<T> {
  
  constructor(
    @Inject(MEDIA_TOKENS.THEME_ENRICHER)
    private readonly themeEnricher: IThemeEnricher
  ) {
    super(); 
  }
  
  protected async process(target: T): Promise<T> {
    if (target.themeId) { 
      const result = await this.themeEnricher.enrichTheme(target.themeId); //
      
      if (result.isRight()) { 
        target.theme = result.getRight() ?? undefined; 
      }
    }
    return target; 
  }
}