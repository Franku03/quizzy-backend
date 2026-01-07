// src/media/application/ports/i-url-configurable.interface.ts
import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface";
import { BaseEnrichmentHandler } from "../handlers/base-enrichment.handler";

export interface IUrlConfigurable<T extends IHasMediaAssets> extends BaseEnrichmentHandler<T> {
  setContext(urlMap: Map<string, string>): this;
}