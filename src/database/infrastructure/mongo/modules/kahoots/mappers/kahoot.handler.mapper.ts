// src/kahoots/infrastructure/persistence/mongo/mappers/kahoot-read.mapper.ts
import { Injectable } from '@nestjs/common';
import { KahootMongo } from '../../../entities/kahoots.schema';

// Import los Snapshots (las clases)
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { SlideTypeEnum } from 'src/kahoots/domain/value-objects/kahoot.slide.type';

@Injectable()
export class KahootReadMapper {

  mapDocumentToSnapshot(document: KahootMongo): KahootSnapshot {
    return KahootSnapshot.fromRaw({
      id: document.id,
      authorId: document.authorId,
      createdAt: new Date(document.createdAt).toISOString(),
      status: document.status,
      visibility: document.visibility,
      playCount: document.playCount ?? 0,

      details: document.details ? {
        title: document.details.title ?? undefined,
        description: document.details.description ?? undefined,
        category: document.details.category ?? undefined,
      } : undefined,

      styling: {
        themeId: document.styling.themeId,
        imageId: document.styling.imageId ?? undefined,
      },

      slides: document.slides ? this.mapSlidesData(document.slides) : [],
    });
  }

  private mapSlidesData(slides: any[]): any[] {
    return slides.map((slide) => ({
      id: slide.id,
      position: slide.position,
      slideType: slide.slideType as SlideTypeEnum, 
      timeLimitSeconds: slide.timeLimitSeconds,
      questionText: slide.questionText ?? undefined,
      slideImageId: slide.slideImageId ?? undefined,
      pointsValue: slide.pointsValue ?? undefined,
      descriptionText: slide.descriptionText ?? undefined,
      options: this.mapOptionsData(slide.options)
    }));
  }

  private mapOptionsData(options: any[] | null | undefined): any[] {
    if (!options || options.length === 0) return [];

    return options.map((option) => ({
      optionText: option.optionText ?? undefined,
      isCorrect: option.isCorrect,
      optionImageId: option.optionImageId ?? undefined
    }));
  }
}