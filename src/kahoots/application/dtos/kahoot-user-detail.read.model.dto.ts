// src\kahoots\application\dtos\kahoot-user-detail.read.model.dto.ts

import { IHasMediaAssets } from 'src/core/domain/abstractions/media.assets.interface';

export class KahootUserDetailReadModel implements IHasMediaAssets {
  constructor(
    public readonly id: string,
    public title: string | null,
    public description: string | null,
    public coverImageId: string | null, 
    public visibility: string,
    public themeId: string,            
    public author: { id: string; name: string },
    public createdAt: string,
    public playCount: number,
    public category: string | null,
    public status: string,
    public isInProgress: boolean,
    public isCompleted: boolean,
    public isFavorite: boolean,
    public gameState: {
      attemptId: string;
      currentScore: number;
      currentSlide: number;
      totalSlides: number;
      lastPlayedAt: Date;
    } | null,
  ) {}

  /**
   * Recolecta todos los IDs que necesitan ser transformados en URLs
   */
  getMediaAssetIds(): string[] {
    const ids: string[] = [];
    if (this.coverImageId) ids.push(this.coverImageId);
    if (this.themeId) ids.push(this.themeId);
    // Si el avatar del autor también fuera un ID, lo sumas aquí
    return ids;
  }

  /**
   * Muta las propiedades reemplazando el ID por la URL firmada/final
   */
  applyMediaUrls(urlMap: Map<string, string>): void {
    if (this.coverImageId && urlMap.has(this.coverImageId)) {
      this.coverImageId = urlMap.get(this.coverImageId)!;
    }
    
    if (this.themeId && urlMap.has(this.themeId)) {
      this.themeId = urlMap.get(this.themeId)!;
    }
  }
}