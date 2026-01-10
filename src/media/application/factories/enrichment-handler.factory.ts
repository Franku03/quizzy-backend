/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\factories\enrichment-handler.factory.ts

import { Injectable, Inject } from "@nestjs/common";
import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface";
import { IThemeable } from "src/core/domain/abstractions/themeable.interface";
import { AssetEnrichmentHandler } from "../handlers/asset-enrichment.handler";
import { ThemeEnrichmentHandler } from "../handlers/theme-enrichement.handler";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import type { IThemeEnricher } from "../ports/i-theme-enricher.interface";

@Injectable()
export class EnrichmentHandlerFactory {
  constructor(
    @Inject(MEDIA_TOKENS.THEME_ENRICHER)
    private readonly themeEnricher: IThemeEnricher
  ) {}

  // ========== SOLO 2 MÉTODOS BÁSICOS ==========

  public createAssetHandler<T extends IHasMediaAssets>(
    urlMap: Map<string, string>
  ): AssetEnrichmentHandler<T> {
    const handler = new AssetEnrichmentHandler<T>();
    return handler.setContext(urlMap);
  }

  public createThemeHandler<T extends IThemeable>(): ThemeEnrichmentHandler<T> {
    return new ThemeEnrichmentHandler<T>(this.themeEnricher);
  }
}