// src/media/application/handlers/theme-enrichment.handler.ts
import { Injectable, Inject } from "@nestjs/common";
import { IThemeable } from "src/core/domain/abstractions/themeable.interface";
import { BaseEnrichmentHandler } from "./base-enrichment.handler";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import type { IThemeEnricher } from "../ports/i-theme-enricher.interface";

@Injectable()
export class ThemeEnrichmentHandler<T extends IThemeable> 
  extends BaseEnrichmentHandler<T> {
  
  constructor(
    @Inject(MEDIA_TOKENS.THEME_ENRICHER)
    private readonly themeEnricher: IThemeEnricher  // DIP: Depende de abstracción
  ) {
    super();
  }

  // SRP: Solo resuelve temas
  protected async process(target: T): Promise<T> {
    if (target.themeId && !target.theme) {
      const result = await this.themeEnricher.enrichTheme(target.themeId);
      if (result.isRight() && result.getRight()) {
        target.theme = result.getRight()!;
      }
    }
    return target;
  }
}