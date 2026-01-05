import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface";

export class NextSlideReadModel implements IHasMediaAssets{
  constructor(
    public readonly slideId: string,
    public mediaId: string | null,
    public readonly questionType: string,
    public readonly questionText: string,
    public readonly timeLimitSeconds: number,
    // We map the options to a simple structure as requested by the API
    public readonly options: Array<{
      index: number;
      text: string | null;
      mediaId: string | null;
    }>,
  ) {}

  getMediaAssetIds(): string[] {
    // Use a Set to automatically avoid duplicates
    const mediaIds = new Set<string>();

    if (this.mediaId) {
      mediaIds.add(this.mediaId);
    }
    
    this.options.forEach(option => {
      if (option.mediaId) {
        mediaIds.add(option.mediaId);
      }
    });

    return Array.from(mediaIds);
  }

  applyMediaUrls(urlMap: Map<string, string>): void {
    if (this.mediaId && urlMap.has(this.mediaId)) {
      this.mediaId = urlMap.get(this.mediaId)!;
    }
    this.options.forEach(option => {
      if (option.mediaId && urlMap.has(option.mediaId)) {
        option.mediaId = urlMap.get(option.mediaId)!;
      }
    });
  }
}

export class AttemptResumeReadModel implements IHasMediaAssets {
  constructor(
    public readonly attemptId: string,
    public readonly state: string, // 'IN_PROGRESS' | 'COMPLETED'
    public readonly currentScore: number,
    // This field is optional because if the game is COMPLETED, there is no next slide
    public readonly nextSlide: NextSlideReadModel | null,
  ) {}

  // 1. Delegate ID collection
  getMediaAssetIds(): string[] {
    if (!this.nextSlide) {
      return [];
    }
    // The child class (NextSlide) already knows how to find its IDs (options + main image)
    return this.nextSlide.getMediaAssetIds();
  }

  // 2. Delegate URL application
  applyMediaUrls(urlMap: Map<string, string>): void {
    if (this.nextSlide) {
      this.nextSlide.applyMediaUrls(urlMap);
    }
  }
} 