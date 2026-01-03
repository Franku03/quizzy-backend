// src/media/application/handlers/media-enrichment.handler.ts
import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface"; //

export abstract class MediaEnrichmentHandler<T extends IHasMediaAssets> {
  private nextHandler: MediaEnrichmentHandler<T> | null = null; 
  
  public setNext(handler: MediaEnrichmentHandler<T>): MediaEnrichmentHandler<T> {
    this.nextHandler = handler; 
    return handler; 
  }
  
  public async handle(target: T): Promise<T> {
    const processed = await this.process(target); 
    
    if (this.nextHandler) { 
      return this.nextHandler.handle(processed); 
    }
    
    return processed; 
  }
  
  protected abstract process(target: T): Promise<T> | T; 
}