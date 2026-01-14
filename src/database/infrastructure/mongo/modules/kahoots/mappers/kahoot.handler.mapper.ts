/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\modules\kahoots\mappers\kahoot.handler.mapper.ts

import {
  IKahootDocument,
  SlideSnapshot as MongoSlide,
  OptionSnapshot as MongoOption,
} from '../../../entities/kahoots.schema';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { SlideSnapshot } from 'src/core/domain/snapshots/snapshot.slide';
import { OptionSnapshot } from 'src/core/domain/snapshots/snapshot.option';
import { SlideTypeEnum } from 'src/kahoots/domain/value-objects/kahoot.slide.type';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';

export class KahootReadMapper implements IMapper<
  IKahootDocument,
  KahootSnapshot
> {
  public map(document: IKahootDocument): KahootSnapshot {
    return KahootSnapshot.fromRaw({
      id: document.id,
      authorId: document.authorId,
      createdAt: new Date(document.createdAt).toISOString(),
      status: document.status,
      visibility: document.visibility,
      playCount: document.playCount,

      details: document.details
        ? {
            title: document.details.title ?? undefined,
            description: document.details.description ?? undefined,
            category: document.details.category ?? undefined,
          }
        : undefined,

      styling: {
        themeId: document.styling.themeId,
        imageId: document.styling.imageId ?? undefined,
      },

      slides: document.slides ? this.mapSlidesData(document.slides) : [],
    });
  }

  /**
   * Mapea los slides usando el Snapshot del DOMINIO.
   */
  private mapSlidesData(slides: MongoSlide[]): SlideSnapshot[] {
    return slides.map((slide) =>
      SlideSnapshot.fromRaw({
        id: slide.id,
        position: slide.position,
        slideType: slide.slideType as SlideTypeEnum,
        timeLimitSeconds: slide.timeLimitSeconds,
        questionText: slide.questionText ?? undefined,
        slideImageId: slide.slideImageId ?? undefined,
        pointsValue: slide.pointsValue ?? undefined,
        descriptionText: slide.descriptionText ?? undefined,
        options: this.mapOptionsData(slide.options),
      }),
    );
  }

  /**
   * Mapea las opciones usando el Snapshot del DOMINIO.
   */
  private mapOptionsData(
    options: MongoOption[] | null | undefined,
  ): OptionSnapshot[] {
    if (!options || options.length === 0) return [];

    return options.map((option) =>
      OptionSnapshot.fromRaw({
        optionText: option.optionText ?? undefined,
        isCorrect: option.isCorrect,
        optionImageId: option.optionImageId ?? undefined,
      }),
    );
  }
}
