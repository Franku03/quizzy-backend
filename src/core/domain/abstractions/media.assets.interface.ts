/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\abstractions\media.assets.interface.ts

export interface IHasMediaAssets {
  /** Extrae todos los IDs de assets (IDs de MongoDB/UUIDs) */
  getMediaAssetIds(): string[];

  /** Inyecta las URLs finales una vez resueltas */
  applyMediaUrls(urlMap: Map<string, string>): void;
}
