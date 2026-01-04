// src/media/application/ports/i-url-configurable.interface.ts
import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface";
import { MediaEnrichmentHandler } from "../handlers/media-enrichment.handler";

export interface IUrlConfigurable<T extends IHasMediaAssets> extends MediaEnrichmentHandler<T> {
  setContext(urlMap: Map<string, string>): this;
}