/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\snapshots\snapshot.slide.ts

import { SlideTypeEnum } from "src/kahoots/domain/value-objects/kahoot.slide.type";
import { IHasMediaAssets } from "../abstractions/media.assets.interface";
import { OptionSnapshotData, OptionSnapshot } from "./snapshot.option";

export interface SlideSnapshotData {
    id: string; 
    position: number;
    slideType: SlideTypeEnum; 
    timeLimitSeconds: number; 
    questionText?: string; 
    slideImageId?: string; 
    pointsValue?: number; 
    descriptionText?: string; 
    options?: OptionSnapshotData[]; 
}

export class SlideSnapshot implements IHasMediaAssets {
  private constructor(
    public id: string,
    public position: number,
    public slideType: SlideTypeEnum,
    public timeLimitSeconds: number,
    public questionText?: string,
    public slideImageId?: string,
    public pointsValue?: number,     
    public descriptionText?: string,  
    public options: OptionSnapshot[] = []
  ) {}

  static fromRaw(data: SlideSnapshotData): SlideSnapshot {
    return new SlideSnapshot(
      data.id,
      data.position,
      data.slideType,
      data.timeLimitSeconds,
      data.questionText,
      data.slideImageId,
      data.pointsValue,      
      data.descriptionText, 
      data.options?.map(opt => OptionSnapshot.fromRaw(opt)) || []
    );
  }

  getMediaAssetIds(): string[] {
    const ids = this.slideImageId ? [this.slideImageId] : [];
    this.options.forEach(opt => ids.push(...opt.getMediaAssetIds()));
    return ids;
  }

  applyMediaUrls(urlMap: Map<string, string>): void {
    if (this.slideImageId && urlMap.has(this.slideImageId)) {
      const url = urlMap.get(this.slideImageId);
      if (url) this.slideImageId = url;
    }
    this.options.forEach(opt => opt.applyMediaUrls(urlMap));
  }
}