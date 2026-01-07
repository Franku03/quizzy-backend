// src/media/application/handlers/asset-enrichment.handler.ts
import { Injectable } from "@nestjs/common";
import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface";
import { BaseEnrichmentHandler } from "./base-enrichment.handler";

@Injectable()
export class AssetEnrichmentHandler<T extends IHasMediaAssets> 
  extends BaseEnrichmentHandler<T> {
  
  private urlMap: Map<string, string> = new Map();

  // SRP: Solo aplica URLs de assets
  public setContext(urlMap: Map<string, string>): this {
    this.urlMap = urlMap;
    return this;
  }

  protected process(target: T): T {
    target.applyMediaUrls(this.urlMap);
    return target;
  }
}