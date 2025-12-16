// src/kahoots/application/ports/i-media-enricher.interface.ts
export interface IMediaEnricher<T> {
  enrich(target: T): Promise<T>;
  enrichMany(targets: T[]): Promise<T[]>;
}