import { IHasMediaAssets } from "../abstractions/media.assets.interface";
import { KahootDetailsSnapshot } from "./snapshot.kahoot.details";
import { KahootStylingSnapshotData, KahootStylingSnapshot } from "./snapshot.kahoot.styling";
import { SlideSnapshotData, SlideSnapshot } from "./snapshot.slide";

export interface KahootSnapshotData {
  id: string;
  authorId: string;
  createdAt: string;
  visibility: string;
  status: string;
  playCount: number;
  styling: KahootStylingSnapshotData;
  slides?: SlideSnapshotData[];
  details?: KahootDetailsSnapshot;
}

export class KahootSnapshot implements IHasMediaAssets {
  private constructor(
    public id: string,
    public authorId: string,
    public createdAt: string,
    public visibility: string,
    public status: string,
    public playCount: number,
    public styling: KahootStylingSnapshot,
    public slides: SlideSnapshot[] = [],
    public details?: KahootDetailsSnapshot
  ) {}

  public static fromRaw(data: KahootSnapshotData): KahootSnapshot {
    return new KahootSnapshot(
      data.id,
      data.authorId,
      data.createdAt,
      data.visibility,
      data.status,
      data.playCount,
      KahootStylingSnapshot.fromRaw(data.styling),
      data.slides?.map(s => SlideSnapshot.fromRaw(s)) || [],
      data.details
    );
  }

  public getMediaAssetIds(): string[] {
    const ids = this.styling.getMediaAssetIds();
    this.slides.forEach(s => ids.push(...s.getMediaAssetIds()));
    return [...new Set(ids)];
  }

  public applyMediaUrls(urlMap: Map<string, string>): void {
    this.styling.applyMediaUrls(urlMap);
    this.slides.forEach(s => s.applyMediaUrls(urlMap));
  }
  
}