import { Injectable, Inject } from "@nestjs/common";
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.styling";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import type { IImageUrlEnricher } from "../ports/i-image-url-enricher.interface";
import type { IThemeEnricher } from "../ports/i-theme-enricher.interface";
import { EnrichmentHandlerFactory } from "../factories/enrichment-handler.factory";
import { AttemptReportReadModel } from "src/reports/application/queries/read-models/solo.attempt.report.read.model";
import { AttemptResumeReadModel } from "src/solo-attempts/application/queries/read-models/resume.attempt.read.model";
import { PaginatedKahootListReadModel, KahootListReadModel } from "src/explore/application/read-models/kahoot-list.read-model";
import { ThemeObject } from "src/core/types/theme.object";


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

  // Cache de promesas de temas en curso
  // Cuando múltiples requests solicitan el mismo themeId simultáneamente,
  // solo se realiza una llamada real al themeEnricher.
  private themePromiseCache = new Map<string, Promise<ThemeObject>>();

  // Cache de resultados de temas ya resueltos: para acceso inmediato posterior
  private themeResultCache = new Map<string, ThemeObject>();

  // ============================================================================
  // MÉTODOS PÚBLICOS DE ENRIQUECIMIENTO
  // ============================================================================

  /**
   * Enriquece un KahootSnapshot completo incluyendo styling (siempre existe) y slides.
   * Optimización: themeId se incluye en el batch de URLs para evitar consultas separadas.
   * Regla de negocio: todo kahoot tiene styling con themeId.
   */
  public async enrichKahoot(kahoot: KahootSnapshot): Promise<KahootSnapshot> {
    // Styling siempre existe (regla de negocio)
    const styling = kahoot.styling!;

    // ======================= RECOLECCIÓN DE TODOS LOS IDs =======================
    const allMediaIds = new Set<string>();

    // themeId siempre existe
    allMediaIds.add(styling.themeId);

    // imageId es opcional
    if (styling.imageId) {
      allMediaIds.add(styling.imageId);
    }

    // IDs de todos los slides
    if (kahoot.slides?.length) {
      kahoot.slides.forEach(slide => {
        slide.getMediaAssetIds().forEach(id => allMediaIds.add(id));
      });
    }
    // ============================================================================

    // Resolver TODOS los IDs en un solo batch
    const urlMap = await this.resolveUrlMap(Array.from(allMediaIds));

    // Resolver tema con deduplicación de llamadas concurrentes
    styling.theme = await this.resolveThemeWithDeduplication(styling.themeId, urlMap);

    // Aplicar URLs al styling (imageId si existe)
    styling.applyMediaUrls(urlMap);

    // Procesar slides en paralelo
    if (kahoot.slides?.length) {
      const slideUrlHandler = this.handlerFactory.createUrlHandler<SlideSnapshot>(urlMap);
      await Promise.all(
        kahoot.slides.map(slide => slideUrlHandler.handle(slide))
      );
    }

    return kahoot;
  }

  /**
   * Enriquece un KahootStylingSnapshot individual.
   * Siempre incluye themeId en el batch de URLs.
   */
  public async enrichStyling(styling: KahootStylingSnapshot): Promise<KahootStylingSnapshot> {
    const mediaIds = styling.getMediaAssetIds(); // Solo devuelve imageId si existe
    const allIds = [styling.themeId, ...mediaIds]; // themeId siempre + imageId opcional

    const urlMap = await this.resolveUrlMap(allIds);

    // Resolver tema
    styling.theme = await this.resolveThemeWithDeduplication(styling.themeId, urlMap);

    // Aplicar URLs
    styling.applyMediaUrls(urlMap);

    return styling;
  }

  /**
   * Enriquece un SlideSnapshot (no tiene temas, solo URLs).
   */
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

  public async enrichAttemptResume(resume: AttemptResumeReadModel): Promise<AttemptResumeReadModel> {
    const assetIds = resume.getMediaAssetIds();
    if (assetIds.length === 0) return resume;

    const urlMap = await this.resolveUrlMap(assetIds);
    return this.handlerFactory.createUrlHandler<AttemptResumeReadModel>(urlMap).handle(resume);
  }

  // ============================================================================
  // LÓGICA PRIVADA CON DOBLE CACHE PARA DEDUPLICACIÓN CONCURRENTE
  // ============================================================================

  /**
   * Resuelve un tema con deduplicación de llamadas concurrentes.
   * 
   * Estrategia de doble cache:
   * 1. themeResultCache: Resultados finales ya resueltos (acceso inmediato)
   * 2. themePromiseCache: Promesas en curso 
   * 
   * Escenario: 5 requests solicitan el mismo themeId simultáneamente
   * - Request 1: Crea promesa, la guarda en themePromiseCache
   * - Requests 2-5: Obtienen la MISMA promesa de themePromiseCache (no duplican llamada)
   * - Request 6 (posterior): Obtiene resultado de themeResultCache (acceso inmediato)
   */
  private async resolveThemeWithDeduplication(
    themeId: string,
    urlMap: Map<string, string>
  ): Promise<ThemeObject | undefined> {
    // ================== PASO 1: VERIFICAR CACHE DE RESULTADOS ==================
    // Si ya tenemos el tema resuelto, retornarlo inmediatamente.
    if (this.themeResultCache.has(themeId)) {
      return this.themeResultCache.get(themeId);
    }

    // ================== PASO 2: VERIFICAR CACHE DE PROMESAS ====================
    // Si ya hay una promesa en curso para este themeId, usarla.
    // Esto previene múltiples llamadas simultáneas al mismo recurso.
    if (this.themePromiseCache.has(themeId)) {
      return this.themePromiseCache.get(themeId);
    }

    // ================== PASO 3: CREAR NUEVA PROMESA ============================
    // No hay cache, crear nueva promesa y guardarla para deduplicación.
    const themePromise = this.resolveThemeInternal(themeId, urlMap)
      .then(theme => {
        // Guardar resultado en cache de resultados
        if (theme) {
          this.themeResultCache.set(themeId, theme);
        }
        // Limpiar cache de promesas (ya no está en curso)
        this.themePromiseCache.delete(themeId);
        return theme;
      })
      .catch(error => {
        // En caso de error, limpiar cache de promesas
        this.themePromiseCache.delete(themeId);
        // Propagamos el error (el caller debe manejarlo)
        throw error;
      });

    // Guardar promesa en cache para deduplicación concurrente
    this.themePromiseCache.set(themeId, themePromise);

    return themePromise;
  }

  /**
   * Lógica interna para resolver un tema individual.
   * Prioridad: 1. Tema completo con nombre | 2. Tema básico con URL | 3. undefined
   */
  private async resolveThemeInternal(
    themeId: string,
    urlMap: Map<string, string>
  ): Promise<ThemeObject> {
    // =============== INTENTAR OBTENER TEMA COMPLETO CON NOMBRE ================
    const themeResult = await this.themeEnricher.enrichTheme(themeId);

    if (themeResult.isRight() && themeResult.getRight()) {
      const theme = themeResult.getRight();
      // theme puede ser ThemeObject o null
      if (theme) {
        return theme; 
      }
    }

    // ================== FALLBACK: TEMA BÁSICO CON URL =========================
    // Si no se pudo obtener el tema completo pero tenemos la URL,
    // crear un tema básico (sin nombre real).
    if (urlMap.has(themeId)) {
      return {id: themeId,url: urlMap.get(themeId)!,name: 'Tema'};
    }

    // ====================== SIN TEMA DISPONIBLE ==============================
    return {id: themeId,url: '',name: ''};
  }

  /**
   * Resuelve un batch de IDs a URLs usando el servicio de infraestructura.
   * Nota: AssetResolutionService ya filtra IDs no existentes.
   */
  private async resolveUrlMap(ids: string[]): Promise<Map<string, string>> {
    const cleanIds = ids.filter(id => !!id);
    if (cleanIds.length === 0) return new Map();

    const resultEither = await this.imageService.resolveUrlsBatch(cleanIds);
    return resultEither.isRight() ? resultEither.getRight()! : new Map();
  }

  /**
   * Limpia ambos caches (útil para testing o reinicio de estado).
   */
  public clearThemeCache(): void {
    this.themePromiseCache.clear();
    this.themeResultCache.clear();
  }
}

