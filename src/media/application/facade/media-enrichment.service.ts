// src/media/application/facade/media-enrichment.service.ts
import { Inject, Injectable } from "@nestjs/common";

// Snapshots
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { OptionSnapshot } from "src/core/domain/snapshots/snapshot.option";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.stiyling";

// Ports & Tokens
import type { IImageUrlEnricher } from "../ports/i-image-url-enricher.interface";
import type { IMediaEnricher } from "../ports/i-media-enricher.interface"; 
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens"; 

@Injectable()
export class MediaEnrichmentService {
  constructor(
    @Inject(MEDIA_TOKENS.KAHOOT_MEDIA_ENRICHER)
    private readonly kahootEnricher: IMediaEnricher<KahootSnapshot>,

    @Inject(MEDIA_TOKENS.SLIDE_MEDIA_ENRICHER)
    private readonly slideEnricher: IMediaEnricher<SlideSnapshot>,

    @Inject(MEDIA_TOKENS.STYLING_MEDIA_ENRICHER)
    private readonly stylingEnricher: IMediaEnricher<KahootStylingSnapshot>,

    @Inject(MEDIA_TOKENS.OPTION_MEDIA_ENRICHER)
    private readonly optionEnricher: IMediaEnricher<OptionSnapshot>,
    
    @Inject(MEDIA_TOKENS.IMAGE_URL_ENRICHER)
    private readonly imageService: IImageUrlEnricher
  ) {}

  // =================================================================
  // 1. ENRICH KAHOOT (Raíz)
  // =================================================================
  async enrichKahoot(k: KahootSnapshot): Promise<KahootSnapshot> { 
    // A. Recolectar IDs 
    const ids = this.extractKahootIds(k);
    
    // B. Resolver Mapa 
    const map = await this.resolveMap(ids);

    // C. Enriquecer (Delegamos a la implementación inyectada)
    // Nota: Funciona sea síncrono o asíncrono gracias al 'async' del método padre.
    return this.kahootEnricher.enrich(k, map); 
  }

  // =================================================================
  // 2. ENRICH SLIDE (Individual)
  // =================================================================
  async enrichSlide(s: SlideSnapshot): Promise<SlideSnapshot> { 
    const ids = this.extractSlideIds(s);
    const map = await this.resolveMap(ids);

    return this.slideEnricher.enrich(s, map); 
  }

  // =================================================================
  // 3. ENRICH STYLING
  // =================================================================
  async enrichStyling(st: KahootStylingSnapshot): Promise<KahootStylingSnapshot> { 
    const ids = st.imageId ? [st.imageId] : [];
    const map = await this.resolveMap(ids);
    return this.stylingEnricher.enrich(st, map); 
  }

  // =================================================================
  // 4. ENRICH OPTION
  // =================================================================
  async enrichOption(o: OptionSnapshot): Promise<OptionSnapshot> { 
    const ids = o.optionImageId ? [o.optionImageId] : [];
    const map = await this.resolveMap(ids);
    
    return this.optionEnricher.enrich(o, map); 
  }

  // =================================================================
  // HELPERS PRIVADOS
  // =================================================================

  /**
   * Resuelve una lista de IDs a un Mapa URL de forma segura.
   * Centraliza el acceso a la infraestructura de imágenes.
   */
  private async resolveMap(ids: string[]): Promise<Map<string, string>> {
    // Si no hay IDs, ahorramos el viaje 
    if (ids.length === 0) return new Map();

    const resultEither = await this.imageService.resolveUrlsBatch(ids);
    return resultEither.isRight() ? resultEither.getRight() : new Map();
  }

  private extractKahootIds(k: KahootSnapshot): string[] {
    const ids: string[] = [];
    if (k.styling?.imageId) ids.push(k.styling.imageId);
    if (k.slides) {
      k.slides.forEach(s => ids.push(...this.extractSlideIds(s)));
    }
    return ids;
  }

  private extractSlideIds(s: SlideSnapshot): string[] {
    const ids: string[] = [];
    if (s.slideImageId) ids.push(s.slideImageId);
    if (s.options) {
      s.options.forEach(o => {
        if (o.optionImageId) ids.push(o.optionImageId);
      });
    }
    return ids;
  }
}