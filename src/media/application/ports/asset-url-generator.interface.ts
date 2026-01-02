// src/media/application/ports/asset-url-generator.interface.ts
export interface IAssetUrlGenerator {
  /**
   * Genera URL para un asset
   */
  generateUrl(publicId: string): string;
  
  /**
   * Genera URLs para múltiples assets
   */
  generateUrls(publicIds: string[]): Map<string, string>;
}