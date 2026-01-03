// src/media/application/ports/i-url-enrichable.interface.ts
export interface IUrlEnrichable {
  applyMediaUrls(urlMap: Map<string, string>): void;
}
