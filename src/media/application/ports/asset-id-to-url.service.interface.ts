// src/media/application/ports/asset-id-to-url.service.interface.ts
export interface IAssetIdToUrlService {
  /**
   * Convierte un assetId a URL
   */
  getUrl(assetId: string): Promise<string | null>;
  
  /**
   * Convierte múltiples assetIds a URLs (batch)
   */
  getUrls(assetIds: string[]): Promise<Map<string, string>>;
}