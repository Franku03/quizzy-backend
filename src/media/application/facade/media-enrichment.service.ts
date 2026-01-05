import { Injectable, Inject } from "@nestjs/common";
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.styling";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { ThemeObject } from "src/core/types/theme.object";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import type { IImageUrlEnricher } from "../ports/i-image-url-enricher.interface";
import type { IThemeEnricher } from "../ports/i-theme-enricher.interface";
import { EnrichmentHandlerFactory } from "../factories/enrichment-handler.factory";
import { AttemptReportReadModel } from "src/reports/application/queries/read-models/solo.attempt.report.read.model";
import { AttemptResumeReadModel } from "src/solo-attempts/application/queries/read-models/resume.attempt.read.model";
import { PaginatedKahootListReadModel, KahootListReadModel } from "src/explore/application/read-models/kahoot-list.read-model";
import { LibraryReadModel } from "src/library/application/queries/read-model/library.read.model";

@Injectable()
export class MediaEnrichmentService {
  constructor(
    @Inject(MEDIA_TOKENS.IMAGE_URL_ENRICHER)
    private readonly imageService: IImageUrlEnricher,

    @Inject(MEDIA_TOKENS.THEME_ENRICHER)
    private readonly themeEnricher: IThemeEnricher,

    private readonly handlerFactory: EnrichmentHandlerFactory
  ) { }

  // ============================================================================
  // CACHE CON DOBLE ESTRATEGIA PARA PREVENIR LLAMADAS DUPLICADAS CONCURRENTES
  // ============================================================================
  private themePromiseCache = new Map<string, Promise<ThemeObject>>();
  private themeResultCache = new Map<string, ThemeObject>();

  // ============================================================================
  // MÉTODOS PÚBLICOS DE ENRIQUECIMIENTO
  // ============================================================================

  public async enrichKahoot(kahoot: KahootSnapshot): Promise<KahootSnapshot> {
    const styling = kahoot.styling!;
    const allMediaIds = new Set<string>();

    allMediaIds.add(styling.themeId);

    if (styling.imageId) {
      allMediaIds.add(styling.imageId);
    }

    if (kahoot.slides?.length) {
      kahoot.slides.forEach(slide => {
        slide.getMediaAssetIds().forEach(id => allMediaIds.add(id));
      });
    }

    const urlMap = await this.resolveUrlMap(Array.from(allMediaIds));
    styling.theme = await this.resolveThemeWithDeduplication(styling.themeId, urlMap);
    styling.applyMediaUrls(urlMap);

    if (kahoot.slides?.length) {
      const slideUrlHandler = this.handlerFactory.createUrlHandler<SlideSnapshot>(urlMap);
      await Promise.all(
        kahoot.slides.map(slide => slideUrlHandler.handle(slide))
      );
    }

    return kahoot;
  }

  public async enrichStyling(styling: KahootStylingSnapshot): Promise<KahootStylingSnapshot> {
    const mediaIds = styling.getMediaAssetIds();
    const allIds = [styling.themeId, ...mediaIds];

    const urlMap = await this.resolveUrlMap(allIds);
    styling.theme = await this.resolveThemeWithDeduplication(styling.themeId, urlMap);
    styling.applyMediaUrls(urlMap);

    return styling;
  }

  public async enrichSlide(slide: SlideSnapshot): Promise<SlideSnapshot> {
    const urlMap = await this.resolveUrlMap(slide.getMediaAssetIds());
    return this.handlerFactory.createUrlHandler<SlideSnapshot>(urlMap).handle(slide);
  }

  // ============================================================================
  // MÉTODOS PARA READ MODELS Y LISTAS 
  // ============================================================================

  public async enrichKahootList(items: KahootListReadModel[]): Promise<KahootListReadModel[]> {
    if (items.length === 0) return items;
    const allIds = new Set<string>();
    items.forEach(item => {
      item.getMediaAssetIds().forEach(id => allIds.add(id));
    });
    if (allIds.size === 0) return items;
    const urlMap = await this.resolveUrlMap(Array.from(allIds));
    const handler = this.handlerFactory.createUrlHandler<KahootListReadModel>(urlMap);
    items.forEach(item => handler.handle(item));
    return items;
  }

  public async enrichPaginatedKahootList(list: PaginatedKahootListReadModel): Promise<PaginatedKahootListReadModel> {
    const assetIds = list.getMediaAssetIds();
    if (assetIds.length === 0) return list;
    const urlMap = await this.resolveUrlMap(assetIds);
    return this.handlerFactory.createUrlHandler<PaginatedKahootListReadModel>(urlMap).handle(list);
  }

  public async enrichAttemptReport(report: AttemptReportReadModel): Promise<AttemptReportReadModel> {
    const urlMap = await this.resolveUrlMap(report.getMediaAssetIds());
    return this.handlerFactory.createUrlHandler<AttemptReportReadModel>(urlMap).handle(report);
  }

  public async enrinchLibraryReadModel(libraryReadModel: LibraryReadModel) {
    const urlMap = await this.resolveUrlMap(libraryReadModel.getMediaAssetIds());
    return this.handlerFactory
      .createUrlHandler<LibraryReadModel>(urlMap)
      .handle(libraryReadModel);
  }

  public async enrichAttemptResume(resume: AttemptResumeReadModel): Promise<AttemptResumeReadModel> {
    const assetIds = resume.getMediaAssetIds();
    if (assetIds.length === 0) return resume;
    const urlMap = await this.resolveUrlMap(assetIds);
    return this.handlerFactory.createUrlHandler<AttemptResumeReadModel>(urlMap).handle(resume);
  }

  // ============================================================================
  // LÓGICA PRIVADA CON DOBLE CACHE PARA DEDUPLICACIÓN CONCURRENTE
  // ============================================================================

  private async resolveThemeWithDeduplication(
    themeId: string,
    urlMap: Map<string, string>
  ): Promise<ThemeObject> {
    if (this.themeResultCache.has(themeId)) {
      return this.themeResultCache.get(themeId)!;
    }

    if (this.themePromiseCache.has(themeId)) {
      return this.themePromiseCache.get(themeId)!;
    }

    const themePromise = this.resolveThemeInternal(themeId, urlMap)
      .then(theme => {
        if (theme) {
          this.themeResultCache.set(themeId, theme);
        }
        this.themePromiseCache.delete(themeId);
        return theme;
      })
      .catch(error => {
        this.themePromiseCache.delete(themeId);
        throw error;
      });

    this.themePromiseCache.set(themeId, themePromise);
    return themePromise;
  }

  private async resolveThemeInternal(
    themeId: string,
    urlMap: Map<string, string>
  ): Promise<ThemeObject> {
    const themeResult = await this.themeEnricher.enrichTheme(themeId);

    if (themeResult.isRight() && themeResult.getRight()) {
      const theme = themeResult.getRight();
      if (theme) return theme;
    }

    if (urlMap.has(themeId)) {
      return { id: themeId, url: urlMap.get(themeId)!, name: 'Tema' };
    }

    return { id: themeId, url: '', name: '' };
  }

  private async resolveUrlMap(ids: string[]): Promise<Map<string, string>> {
    const cleanIds = ids.filter(id => !!id);
    if (cleanIds.length === 0) return new Map();

    const resultEither = await this.imageService.resolveUrlsBatch(cleanIds);
    return resultEither.isRight() ? resultEither.getRight()! : new Map();
  }

  public clearThemeCache(): void {
    this.themePromiseCache.clear();
    this.themeResultCache.clear();
  }
}