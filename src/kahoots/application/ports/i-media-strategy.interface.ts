// src/kahoots/application/ports/i-media-strategy.interface.ts
export interface IMediaStrategy<T> {
  extractMediaIds(target: T): string[];
  replaceWithUrls(target: T, urlMap: Map<string, string>): void;
}