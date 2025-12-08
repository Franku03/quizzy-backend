// src/media/application/ports/asset-url.service.interface.ts
export interface IAssetUrlService {
  /**
   * Genera URLs para múltiples assets 
   */
  generateUrls(
    assets: Array<{ provider: string; publicId: string }>,
    options?: {
      signed?: boolean;
      expiresIn?: number;
      transformations?: Record<string, any>;
    }
  ): Map<string, string>;
}