import { ThemeObject } from "src/core/types/theme.object";
import { IHasMediaAssets } from "../abstractions/media.assets.interface";
import { IThemeable } from "../abstractions/themeable.interface";

export interface KahootStylingSnapshotData {
  themeId: string;
  imageId?: string;
  theme?: ThemeObject;
}

export class KahootStylingSnapshot implements IHasMediaAssets, IThemeable {
  private constructor(
    public themeId: string,
    public imageId?: string,
    public theme?: ThemeObject
  ) {}

  public static fromRaw(data: KahootStylingSnapshotData): KahootStylingSnapshot {
    return new KahootStylingSnapshot(data.themeId, data.imageId, data.theme);
  }

  public getMediaAssetIds(): string[] {
    return this.imageId ? [this.imageId] : [];
  }

  public applyMediaUrls(urlMap: Map<string, string>): void {
    if (this.imageId && urlMap.has(this.imageId)) {
      this.imageId = urlMap.get(this.imageId);
    }
  }
}