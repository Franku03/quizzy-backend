/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\snapshots\snapshot.option.ts

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