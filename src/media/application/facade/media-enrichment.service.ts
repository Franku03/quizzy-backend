// src/media/application/services/media-enrichment.service.ts
import { Injectable, Inject } from "@nestjs/common";
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.styling";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import type { IImageUrlEnricher } from "../ports/i-image-url-enricher.interface";
import { EnrichmentHandlerFactory } from "../factories/enrichment-handler.factory";

@Injectable()
export class MediaEnrichmentService {
  constructor(
    @Inject(MEDIA_TOKENS.IMAGE_URL_ENRICHER)
    private readonly imageService: IImageUrlEnricher,
    private readonly handlerFactory: EnrichmentHandlerFactory
  ) { }

  public async enrichMediaUrlById(assetId: string): Promise<string | undefined> {
    const map = await this.resolveUrlMap([assetId]);
    return map.get(assetId);
  }

  public async enrichMediaUrlsById(assetIds: string[]): Promise<Map<string, string>> {
    const result = await this.resolveUrlMap(assetIds);
    return result;
  }

  public async enrichKahoot(kahoot: KahootSnapshot): Promise<KahootSnapshot> {
    // 1. Resolvemos todos los IDs de golpe (Batching eficiente)
    const assetIds = kahoot.getMediaAssetIds();
    const urlMap = await this.resolveUrlMap(assetIds);

    // 2. Enriquecer Styling (Chain: URL -> Theme)
    kahoot.styling = await this.enrichStylingWithMap(kahoot.styling, urlMap);

    // 3. Enriquecer Slides (Solo URL)
    if (kahoot.slides?.length) {
      const slideUrlHandler = this.handlerFactory.createUrlHandler<SlideSnapshot>(urlMap);

      // Procesamos en paralelo para máxima velocidad
      kahoot.slides = await Promise.all(
        kahoot.slides.map(slide => slideUrlHandler.handle(slide))
      );
    }

    return kahoot;
  }

  public async enrichSlide(slide: SlideSnapshot): Promise<SlideSnapshot> {
    const urlMap = await this.resolveUrlMap(slide.getMediaAssetIds());
    return this.handlerFactory.createUrlHandler<SlideSnapshot>(urlMap).handle(slide);
  }

  public async enrichStyling(styling: KahootStylingSnapshot): Promise<KahootStylingSnapshot> {
    const urlMap = await this.resolveUrlMap(styling.getMediaAssetIds());
    return this.enrichStylingWithMap(styling, urlMap);
  }

  private async enrichStylingWithMap(
    styling: KahootStylingSnapshot,
    urlMap: Map<string, string>
  ): Promise<KahootStylingSnapshot> {
    // Creamos los eslabones de la cadena
    const urlHandler = this.handlerFactory.createUrlHandler<KahootStylingSnapshot>(urlMap);
    const themeHandler = this.handlerFactory.createThemeHandler<KahootStylingSnapshot>();

    // Configuramos la cadena: URL primero, luego el Tema
    urlHandler.setNext(themeHandler);

    // Ejecutamos la cadena completa
    return urlHandler.handle(styling);
  }

  private async resolveUrlMap(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();

    const resultEither = await this.imageService.resolveUrlsBatch(ids);

    if (resultEither.isLeft()) {
      //Da igual si falla, creo yo preferi dar esto asi xd
      return new Map();
    }

    return resultEither.getRight()!;
  }
}