// src/media/application/factories/enrichment-handler.factory.ts
import { Injectable } from "@nestjs/common";
import { UrlEnrichmentHandler } from "../handlers/url-enrichment.handler";
import { ThemeEnrichmentHandler } from "../handlers/theme-enrichemnt.handler";
import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface";
import { IThemeable } from "src/core/domain/abstractions/themeable.interface";
import { IUrlConfigurable } from "../ports/i-url-configurable.interface";
import { MediaEnrichmentHandler } from "../handlers/media-enrichment.handler"; 

@Injectable()
export class EnrichmentHandlerFactory {
  constructor(
    private readonly urlHandlerRef: UrlEnrichmentHandler<IHasMediaAssets>,
    private readonly themeHandlerRef: ThemeEnrichmentHandler<IThemeable & IHasMediaAssets>
  ) {}

  public createUrlHandler<T extends IHasMediaAssets>(urlMap: Map<string, string>): IUrlConfigurable<T> {
    const handler = this.urlHandlerRef as unknown as IUrlConfigurable<T>;
    return handler.setContext(urlMap);
  }

  public createThemeHandler<T extends IThemeable & IHasMediaAssets>(): ThemeEnrichmentHandler<T> {
    return this.themeHandlerRef as unknown as ThemeEnrichmentHandler<T>;
  }
}