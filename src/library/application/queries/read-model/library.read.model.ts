import { IHasMediaAssets } from 'src/core/domain/abstractions/media.assets.interface';

export type Visibility = 'public' | 'private';
export type Status = 'draft' | 'published';

export interface AuthorReadModel {
  id: string; // UUID del autor
  name: string; // nombre del autor
}

export class KahootReadModel {
  constructor(
    public readonly id: string, // UUID del kahoot
    public readonly title: string | null, // opcional
    public readonly description: string | null, // opcional
    public coverImageId: string | null, // URL opcional
    public readonly visibility: Visibility,
    public readonly themeId: string, // UUID del tema
    public readonly author: AuthorReadModel,
    public readonly createdAt: string, // ISO 8601 date string
    public readonly playCount: number,
    public readonly category: string, // ej: "Matematica"
    public readonly status: Status,
  ) {}
}

export class PaginationInfo {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly totalCount: number,
    public readonly totalPages: number,
  ) {}
}

export class LibraryReadModel implements IHasMediaAssets {
  constructor(
    public readonly data: KahootReadModel[],
    public readonly pagination: PaginationInfo,
  ) {}
  getMediaAssetIds(): string[] {
    const mediaIds: string[] = [];
    this.data.forEach((kahoot: KahootReadModel) => {
      if (kahoot.coverImageId) mediaIds.push(kahoot.coverImageId);
    });
    return mediaIds;
  }
  applyMediaUrls(urlMap: Map<string, string>): void {
    this.data.forEach((kahoot: KahootReadModel) => {
      if (kahoot.coverImageId && urlMap.has(kahoot.coverImageId)){
        const url = urlMap.get(kahoot.coverImageId);
        if (url) kahoot.coverImageId = url;
      } else {
        kahoot.coverImageId = null;
      }
    });
  }

  toJson() {
    return {
      data: this.data.map((k) => ({
        id: k.id,
        title: k.title,
        description: k.description,
        coverImageId: k.coverImageId,
        visibility: k.visibility,
        themeId: k.themeId,
        author: {
          id: k.author.id,
          name: k.author.name,
        },
        createdAt: k.createdAt,
        playCount: k.playCount,
        category: k.category,
        status: k.status,
      })),
      pagination: {
        page: this.pagination.page,
        limit: this.pagination.limit,
        totalCount: this.pagination.totalCount,
        totalPages: this.pagination.totalPages,
      },
    };
  }
}
