// src/media/application/enrichers/kahoot-media.enricher.ts
import { Inject, Injectable } from "@nestjs/common";
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.stiyling";
import type { IMediaEnricher } from "../ports/i-media-enricher.interface";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";

@Injectable()
export class KahootMediaEnricher implements IMediaEnricher<KahootSnapshot> {
  constructor(
    @Inject(MEDIA_TOKENS.SLIDE_MEDIA_ENRICHER)
    private readonly slideEnricher: IMediaEnricher<SlideSnapshot>,
    
    @Inject(MEDIA_TOKENS.STYLING_MEDIA_ENRICHER)
    private readonly stylingEnricher: IMediaEnricher<KahootStylingSnapshot>
  ) {}

  async enrich(kahoot: KahootSnapshot, urlMap: Map<string, string>): Promise<KahootSnapshot> {
    
    // 1. Styling (Async - Esperamos porque devuelve Promise)
    if (kahoot.styling) {
        // Al ser genérico T | Promise<T>, await lo resuelve correctamente sea lo que sea
        kahoot.styling = await this.stylingEnricher.enrich(kahoot.styling, urlMap);
    }

    // 2. Slides 
    // Usamos Promise.all para manejar tanto si el enricher hijo es síncrono como asíncrono.
    if (kahoot.slides && kahoot.slides.length > 0) {
        const slidePromises = kahoot.slides.map(s => 
            this.slideEnricher.enrich(s, urlMap)
        );
        kahoot.slides = await Promise.all(slidePromises);
    }

    return kahoot;
  }
}



