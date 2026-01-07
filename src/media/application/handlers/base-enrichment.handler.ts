// src/media/application/handlers/base-enrichment.handler.ts
export abstract class BaseEnrichmentHandler<T> {
  protected nextHandler: BaseEnrichmentHandler<T> | null = null;

  public setNext(handler: BaseEnrichmentHandler<T>): this {
    this.nextHandler = handler;
    return this; 
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