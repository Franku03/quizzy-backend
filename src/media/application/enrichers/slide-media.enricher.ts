// src/media/application/enrichers/slide-media.enricher.ts
import { Inject, Injectable } from "@nestjs/common";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { OptionSnapshot } from "src/core/domain/snapshots/snapshot.option";
import type { IMediaEnricher } from "../ports/i-media-enricher.interface";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens"; 

@Injectable()
export class SlideMediaEnricher implements IMediaEnricher<SlideSnapshot> {
  constructor(
    @Inject(MEDIA_TOKENS.OPTION_MEDIA_ENRICHER)
    private readonly optionEnricher: IMediaEnricher<OptionSnapshot>
  ) {}

  enrich(slide: SlideSnapshot, urlMap: Map<string, string>): SlideSnapshot {
    
    // 1. Slide Media (Imagen propia)
    if (slide.slideImageId) {
      const url = urlMap.get(slide.slideImageId);
      if (url) {
        slide.slideImageId = url;
      }
    }

    // 2. Opciones (Delegamos a la interfaz inyectada)
    if (slide.options && slide.options.length > 0) {
      slide.options = slide.options.map(opt => 
        this.optionEnricher.enrich(opt, urlMap) as OptionSnapshot
      );
    }

    return slide;
  }
}