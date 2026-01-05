// src/media/application/services/media-enrichment.service.ts
import { Injectable, Inject } from "@nestjs/common";
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.styling";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import type { IImageUrlEnricher } from "../ports/i-image-url-enricher.interface";
import { EnrichmentHandlerFactory } from "../factories/enrichment-handler.factory";
import { AttemptReportReadModel } from "src/reports/application/queries/read-models/solo.attempt.report.read.model";
import { AttemptResumeReadModel } from "src/solo-attempts/application/queries/read-models/resume.attempt.read.model";
import { PaginatedKahootListReadModel } from "src/explore/application/read-models/kahoot-list.read-model";
import { KahootListReadModel } from "src/explore/application/read-models/kahoot-list.read-model";

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


  public async enrichAttemptReport(report: AttemptReportReadModel): Promise<AttemptReportReadModel> {
    // 1. Get IDs directly from the parent
    // (The parent internally asks all its children for their IDs)
    const assetIds = report.getMediaAssetIds();

    // 2. Resolve URLs in batch
    const urlMap = await this.resolveUrlMap(assetIds);

    // 3. Create the Handler for the Parent
    return this.handlerFactory
      .createUrlHandler<AttemptReportReadModel>(urlMap)
      .handle(report);
  }


  public async enrichAttemptResume(resume: AttemptResumeReadModel): Promise<AttemptResumeReadModel> {
    // 1. Get IDs (The Resume model safely handles the null check internally)
    const assetIds = resume.getMediaAssetIds();

    // Optimization: If there are no IDs (e.g. game is finished or slide has no images), skip the rest
    // and return the original object directly
    if (assetIds.length === 0) {
      return resume;
    }

    // 2. Resolve URLs in batch
    const urlMap = await this.resolveUrlMap(assetIds);

    // 3. Apply changes via the Factory
    return this.handlerFactory
      .createUrlHandler<AttemptResumeReadModel>(urlMap)
      .handle(resume);
  }


  public async enrichPaginatedKahootList(list: PaginatedKahootListReadModel): Promise<PaginatedKahootListReadModel> {
    // 1. Aggregate IDs (Parent delegates to children)
    const assetIds = list.getMediaAssetIds();

    if (assetIds.length === 0) {
      return list;
    }

    // 2. Resolve URLs (Batch request for the whole page)
    const urlMap = await this.resolveUrlMap(assetIds);

    // 3. Apply via Factory
    return this.handlerFactory
      .createUrlHandler<PaginatedKahootListReadModel>(urlMap)
      .handle(list);
  }

  /**
   * Enriches a raw array of Kahoot List items efficiently.
   * Collects all IDs first to perform a single batch request for URLs.
   */
  public async enrichKahootList(items: KahootListReadModel[]): Promise<KahootListReadModel[]> {
    // Early exit if no items
    if (items.length === 0) {
      return items;
    }

    // 1. Batch Collection: Gather unique IDs from ALL items in the array
    const allIds = new Set<string>();
    items.forEach(item => {
      // Each item already knows how to give us its IDs
      item.getMediaAssetIds().forEach(id => allIds.add(id));
    });

    if (allIds.size === 0) {
      return items;
    }

    // 2. Single Network Request: Resolve all URLs at once
    const urlMap = await this.resolveUrlMap(Array.from(allIds));

    // 3. Create Handler
    const handler = this.handlerFactory.createUrlHandler<KahootListReadModel>(urlMap);

    // 4. Apply to all items
    items.forEach(item => {
      handler.handle(item);
    });

    return items;
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