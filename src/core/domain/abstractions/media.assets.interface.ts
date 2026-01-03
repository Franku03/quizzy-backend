//src\core\domain\abstractions\media.assets.interface.ts
export interface IHasMediaAssets {
  /** Extrae todos los IDs de assets (IDs de MongoDB/UUIDs) */
  getMediaAssetIds(): string[];
  
  /** Inyecta las URLs finales una vez resueltas */
  applyMediaUrls(urlMap: Map<string, string>): void;
}