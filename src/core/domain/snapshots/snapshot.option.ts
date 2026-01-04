import { IHasMediaAssets } from "../abstractions/media.assets.interface";

export interface OptionSnapshotData {
  optionText?: string;
  isCorrect: boolean;
  optionImageId?: string;
}

export class OptionSnapshot implements IHasMediaAssets {
  private constructor(
    public optionText: string | undefined,
    public isCorrect: boolean,
    public optionImageId?: string
  ) {}

  public static fromRaw(data: OptionSnapshotData): OptionSnapshot {
    return new OptionSnapshot(data.optionText, data.isCorrect, data.optionImageId);
  }

  public getMediaAssetIds(): string[] {
    return this.optionImageId ? [this.optionImageId] : [];
  }

  public applyMediaUrls(urlMap: Map<string, string>): void {
    if (this.optionImageId && urlMap.has(this.optionImageId)) {
      this.optionImageId = urlMap.get(this.optionImageId);
    }
  }
}