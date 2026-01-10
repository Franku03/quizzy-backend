/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\facade\media-enrichment.service.ts

import { Injectable, Inject } from "@nestjs/common";
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.styling";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import type { IImageUrlEnricher } from "../ports/i-image-url-enricher.interface";
import { EnrichmentHandlerFactory } from "../factories/enrichment-handler.factory";
import { AttemptReportReadModel } from "src/reports/application/queries/read-models/solo.attempt.report.read.model";
import { AttemptResumeReadModel } from "src/solo-attempts/application/queries/read-models/resume.attempt.read.model";
import { PaginatedKahootListReadModel, KahootListReadModel } from "src/explore/application/read-models/kahoot-list.read-model";
import { LibraryReadModel } from "src/library/application/queries/read-model/library.read.model";
import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface";
import { IThemeable } from "src/core/domain/abstractions/themeable.interface";

@Injectable()
export class MediaEnrichmentService {
  constructor(
    @Inject(MEDIA_TOKENS.IMAGE_URL_ENRICHER)
    private readonly imageService: IImageUrlEnricher,
    private readonly handlerFactory: EnrichmentHandlerFactory
  ) { }

  // ============================================================================
  // MÉTODO GENÉRICO (para objetos solo con assets)
  // ============================================================================
  public async enrich<T extends IHasMediaAssets>(
    target: T,
    additionalIds: string[] = []
  ): Promise<T> {
    const allIds = [...target.getMediaAssetIds(), ...additionalIds];
    const urlMap = await this.resolveAssetUrls(allIds);

    const handler = this.handlerFactory.createAssetHandler<T>(urlMap);
    return handler.handle(target);
  }

  // ============================================================================
  // MÉTODOS ESPECÍFICOS REFACTORIZADOS
  // ============================================================================

  public async enrichKahoot(kahoot: KahootSnapshot): Promise<KahootSnapshot> {
    // 1. Solo IDs de ASSETS (imágenes) - NO themeId
    const assetIds = this.collectKahootAssetIds(kahoot);
    const urlMap = await this.resolveAssetUrls(assetIds);

    // 2. Enriquecer styling (tema + imagen)
    if (kahoot.styling) {
      await this.enrichStylingInternal(kahoot.styling, urlMap);
    }

    // 3. Enriquecer slides (solo imágenes)
    if (kahoot.slides?.length) {
      const slideHandler = this.handlerFactory.createAssetHandler<SlideSnapshot>(urlMap);
      await Promise.all(
        kahoot.slides.map(slide => slideHandler.handle(slide))
      );
    }

    return kahoot;
  }

  public async enrichStyling(styling: KahootStylingSnapshot): Promise<KahootStylingSnapshot> {
    const assetIds = styling.getMediaAssetIds(); // Solo imageId
    const urlMap = await this.resolveAssetUrls(assetIds);

    return this.enrichStylingInternal(styling, urlMap);
  }

  public async enrichSlide(slide: SlideSnapshot): Promise<SlideSnapshot> {
    return this.enrich(slide);
  }

  /**
     * Enriquece cualquier objeto que implemente IThemeable.
     * El ThemeHandler utiliza el 'themeId' para buscar los datos y 
     * popular la propiedad 'theme' (de tipo ThemeObject).
     */
  public async enrichThemeable<T extends IThemeable>(target: T): Promise<T> {
    const handler = this.handlerFactory.createThemeHandler<T>();

    return handler.handle(target);
  }
  // ============================================================================
  // MÉTODOS PARA READ MODELS (refactorizados internamente)
  // ============================================================================

  public async enrichKahootList(items: KahootListReadModel[]): Promise<KahootListReadModel[]> {
    if (items.length === 0) return items;

    // OPTIMIZACIÓN: Obtener todos los IDs de assets en batch
    const allAssetIds = this.collectAssetIdsFromBatch(items);

    if (allAssetIds.length === 0) return items;

    // OPTIMIZACIÓN: Obtener URLs una sola vez
    const urlMap = await this.resolveAssetUrls(allAssetIds);

    // OPTIMIZACIÓN: Usar mismo handler para todos los items
    const handler = this.handlerFactory.createAssetHandler<KahootListReadModel>(urlMap);

    return Promise.all(
      items.map(item => handler.handle(item))
    );
  }

  public async enrichPaginatedKahootList(list: PaginatedKahootListReadModel): Promise<PaginatedKahootListReadModel> {
    return this.enrich(list);
  }

  public async enrichAttemptReport(report: AttemptReportReadModel): Promise<AttemptReportReadModel> {
    return this.enrich(report);
  }

  public async enrinchLibraryReadModel(libraryReadModel: LibraryReadModel): Promise<LibraryReadModel> {
    return this.enrich(libraryReadModel);
  }

  public async enrichAttemptResume(resume: AttemptResumeReadModel): Promise<AttemptResumeReadModel> {
    return this.enrich(resume);
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  /**
   * Enriquecer styling con COR: ThemeHandler → AssetHandler
   */
  private async enrichStylingInternal(
    styling: KahootStylingSnapshot,
    urlMap: Map<string, string>
  ): Promise<KahootStylingSnapshot> {
    // Crear cadena COR: tema primero, luego assets
    const themeHandler = this.handlerFactory.createThemeHandler<KahootStylingSnapshot>();
    const assetHandler = this.handlerFactory.createAssetHandler<KahootStylingSnapshot>(urlMap);

    themeHandler.setNext(assetHandler);
    return themeHandler.handle(styling);
  }

  /**
   * Recolectar IDs de assets (solo imágenes) de un Kahoot
   * NO incluye themeId
   */
  private collectKahootAssetIds(kahoot: KahootSnapshot): string[] {
    const assetIds = new Set<string>();

    if (kahoot.styling?.imageId) {
      assetIds.add(kahoot.styling.imageId);
    }

    if (kahoot.slides?.length) {
      kahoot.slides.forEach(slide => {
        slide.getMediaAssetIds().forEach(id => assetIds.add(id));
      });
    }

    return Array.from(assetIds);
  }

  /**
   * Recolectar IDs de assets de un batch de items
   */
  private collectAssetIdsFromBatch<T extends IHasMediaAssets>(items: T[]): string[] {
    const allIds = new Set<string>();

    items.forEach(item => {
      item.getMediaAssetIds().forEach(id => allIds.add(id));
    });

    return Array.from(allIds);
  }

  /**
   * Resolver URLs de assets (solo imágenes)
   */
  private async resolveAssetUrls(assetIds: string[]): Promise<Map<string, string>> {
    const cleanIds = assetIds.filter(id => !!id);
    if (cleanIds.length === 0) return new Map();

    const resultEither = await this.imageService.resolveUrlsBatch(cleanIds);
    return resultEither.isRight() ? resultEither.getRight()! : new Map();
  }
}