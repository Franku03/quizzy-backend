// src/media/application/handlers/url-enrichment.handler.ts
import { Injectable, Scope } from "@nestjs/common";
import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface";
import { MediaEnrichmentHandler } from "./media-enrichment.handler";
import { IUrlConfigurable } from "../ports/i-url-configurable.interface";

@Injectable({ scope: Scope.TRANSIENT })
export class UrlEnrichmentHandler<T extends IHasMediaAssets> 
  extends MediaEnrichmentHandler<T> 
  implements IUrlConfigurable<T> {
  
  private urlMap: Map<string, string> = new Map();

  public setContext(urlMap: Map<string, string>): this {
    this.urlMap = urlMap;
    return this;
  }
  
  protected process(target: T): T {
    target.applyMediaUrls(this.urlMap);
    return target;
  }
}