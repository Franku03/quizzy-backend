import { Injectable, Inject } from "@nestjs/common";
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.styling";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { Either, ErrorData } from "src/core/types";

import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import type { IImageUrlEnricher } from "../ports/i-image-url-enricher.interface";
import type { IThemeEnricher } from "../ports/i-theme-enricher.interface";
import { EnrichmentHandlerFactory } from "../factories/enrichment-handler.factory";
import { AttemptReportReadModel } from "src/reports/application/queries/read-models/solo.attempt.report.read.model";
import { AttemptResumeReadModel } from "src/solo-attempts/application/queries/read-models/resume.attempt.read.model";
import { PaginatedKahootListReadModel, KahootListReadModel } from "src/explore/application/read-models/kahoot-list.read-model";

@Injectable()
export class MediaEnrichmentService {
  constructor(
    @Inject(MEDIA_TOKENS.IMAGE_URL_ENRICHER)
    private readonly imageService: IImageUrlEnricher,

    @Inject(MEDIA_TOKENS.THEME_ENRICHER)
    private readonly themeEnricher: IThemeEnricher,

    private readonly handlerFactory: EnrichmentHandlerFactory
  ) {}

  public async enrichMediaUrlById(assetId: string): Promise<string | undefined> {
    const map = await this.resolveUrlMap([assetId]);
    return map.get(assetId);
  }

  public async enrichMediaUrlsById(assetIds: string[]): Promise<Map<string, string>> {
    return this.resolveUrlMap(assetIds);
  }

  public async enrichAttemptReport(report: AttemptReportReadModel): Promise<AttemptReportReadModel> {
    const assetIds = report.getMediaAssetIds();
    const urlMap = await this.resolveUrlMap(assetIds);

    return this.handlerFactory
      .createUrlHandler<AttemptReportReadModel>(urlMap)
      .handle(report);
  }

  public async enrichAttemptResume(resume: AttemptResumeReadModel): Promise<AttemptResumeReadModel> {
    const assetIds = resume.getMediaAssetIds();

    if (assetIds.length === 0) {
      return resume;
    }

    const urlMap = await this.resolveUrlMap(assetIds);

    return this.handlerFactory
      .createUrlHandler<AttemptResumeReadModel>(urlMap)
      .handle(resume);
  }

  public async enrichPaginatedKahootList(list: PaginatedKahootListReadModel): Promise<PaginatedKahootListReadModel> {
    const assetIds = list.getMediaAssetIds();

    if (assetIds.length === 0) {
      return list;
    }

    const urlMap = await this.resolveUrlMap(assetIds);

    return this.handlerFactory
      .createUrlHandler<PaginatedKahootListReadModel>(urlMap)
      .handle(list);
  }

  public async enrichKahootList(items: KahootListReadModel[]): Promise<KahootListReadModel[]> {
    if (items.length === 0) {
      return items;
    }

    const allIds = new Set<string>();
    items.forEach(item => {
      item.getMediaAssetIds().forEach(id => allIds.add(id));
    });

    if (allIds.size === 0) {
      return items;
    }

    const urlMap = await this.resolveUrlMap(Array.from(allIds));
    const handler = this.handlerFactory.createUrlHandler<KahootListReadModel>(urlMap);

    items.forEach(item => {
      handler.handle(item);
    });

    return items;
  }

  public async enrichKahoot(kahoot: KahootSnapshot): Promise<KahootSnapshot> {
    const { urlMap, theme } = await this.resolveMetadataBatch(kahoot);

    if (kahoot.styling) {
      if (theme) kahoot.styling.theme = theme;
      
      this.handlerFactory
        .createUrlHandler<KahootStylingSnapshot>(urlMap)
        .handle(kahoot.styling);
    }

    if (kahoot.slides?.length) {
      const slideUrlHandler = this.handlerFactory.createUrlHandler<SlideSnapshot>(urlMap);

      await Promise.all(
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
    const { urlMap, theme } = await this.resolveMetadataBatchForStyling(styling);
    if (theme) styling.theme = theme;
    return this.handlerFactory.createUrlHandler<KahootStylingSnapshot>(urlMap).handle(styling);
  }

  private async resolveMetadataBatch(kahoot: KahootSnapshot) {
    const [urlMap, themeResult] = await Promise.all([
      this.resolveUrlMap(kahoot.getMediaAssetIds()),
      kahoot.styling?.themeId 
        ? this.themeEnricher.enrichTheme(kahoot.styling.themeId) 
        : Promise.resolve(Either.makeRight<ErrorData, any>(null))
    ]);

    return {
      urlMap,
      theme: themeResult.isRight() ? themeResult.getRight() : undefined
    };
  }

  private async resolveMetadataBatchForStyling(styling: KahootStylingSnapshot) {
    const [urlMap, themeResult] = await Promise.all([
      this.resolveUrlMap(styling.getMediaAssetIds()),
      styling.themeId 
        ? this.themeEnricher.enrichTheme(styling.themeId) 
        : Promise.resolve(Either.makeRight<ErrorData, any>(null))
    ]);

    return { urlMap, theme: themeResult.isRight() ? themeResult.getRight() : undefined };
  }

  private async resolveUrlMap(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const resultEither = await this.imageService.resolveUrlsBatch(ids);
    return resultEither.isRight() ? resultEither.getRight()! : new Map();
  }
}