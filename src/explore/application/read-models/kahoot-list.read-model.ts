// src/modules/kahoot/application/read-models/kahoot-list.read-model.ts (Adjust path as needed)
import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface";

export class KahootListReadModel implements IHasMediaAssets {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly category: string,
    public readonly author: { id: string; name: string },
    public readonly playCount: number,
    public readonly createdAt: Date,
    // This field will start as an ID and become a URL
    public coverImageId: string | null, 
    public readonly themeId: string
  ) {}

  getMediaAssetIds(): string[] {
    return this.coverImageId ? [this.coverImageId] : [];
  }

  applyMediaUrls(urlMap: Map<string, string>): void {
    if (this.coverImageId && urlMap.has(this.coverImageId)) {
      this.coverImageId = urlMap.get(this.coverImageId)!;
    }
  }
}

// src/modules/kahoot/application/read-models/paginated-kahoot-list.read-model.ts
export class PaginatedKahootListReadModel implements IHasMediaAssets {
  constructor(
    public readonly data: KahootListReadModel[],
    public readonly pagination: {
      page: number,
      limit: number,
      totalCount: number,
      totalPages: number
    }
  ) {}

  // 1. Collect unique IDs from all items in the list
  getMediaAssetIds(): string[] {
    const allIds = new Set<string>();
    
    this.data.forEach(item => {
      item.getMediaAssetIds().forEach(id => allIds.add(id));
    });

    return Array.from(allIds);
  }

  // 2. Delegate URL replacement to each item
  applyMediaUrls(urlMap: Map<string, string>): void {
    this.data.forEach(item => {
      item.applyMediaUrls(urlMap);
    });
  }
}