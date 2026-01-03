// src/media/application/enrichers/option-media.enricher.ts
import { Injectable } from "@nestjs/common";
import { OptionSnapshot } from "src/core/domain/snapshots/snapshot.option";
import { IMediaEnricher } from "../ports/i-media-enricher.interface";

@Injectable()
export class OptionMediaEnricher implements IMediaEnricher<OptionSnapshot> {
  
  enrich(option: OptionSnapshot, urlMap: Map<string, string>): OptionSnapshot {
    if (option.optionImageId) {
      const url = urlMap.get(option.optionImageId);
      if (url) {
        option.optionImageId = url;
      }
    }
    return option;
  }
}