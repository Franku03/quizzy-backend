/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\kahoots\mappers\kahoot.snapshot.persitence.pg.mapper.ts

import { DeepPartial } from 'typeorm';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';
import { KahootEntity } from '../../../entities/kahoot/kahoot.entity.pg';
import { SlideEntity } from '../../../entities/kahoot/slide.entitity.pg';
import { OptionEntity } from '../../../entities/kahoot/option.entity.pg';
import { OptionSnapshot } from 'src/core/domain/snapshots/snapshot.option';
import { SlideSnapshot } from 'src/core/domain/snapshots/snapshot.slide';

export class KahootPersistencePgMapper implements IMapper<
  KahootSnapshot,
  DeepPartial<KahootEntity>
> {
  public map(snapshot: KahootSnapshot): DeepPartial<KahootEntity> {
    const { styling, details, slides, ...rest } = snapshot;

    return {
      ...rest,
      themeId: styling.themeId,
      coverImageId: styling.imageId,
      title: details?.title,
      description: details?.description,
      category: details?.category,

      slides: this.mapSlidesToPersistence(slides, snapshot.id),
    };
  }

  private mapSlidesToPersistence(
    slides: SlideSnapshot[],
    kahootId: string,
  ): DeepPartial<SlideEntity>[] {
    return slides.map((slide) => ({
      id: slide.id,
      position: slide.position,
      slideType: slide.slideType,
      timeLimitSeconds: slide.timeLimitSeconds,
      questionText: slide.questionText,
      slideImageId: slide.slideImageId,
      pointsValue: slide.pointsValue,
      descriptionText: slide.descriptionText,
      kahoot: { id: kahootId } as DeepPartial<KahootEntity>,
      options: this.mapOptionsToPersistence(slide.options, slide.id),
    }));
  }

  private mapOptionsToPersistence(
    options: OptionSnapshot[],
    slideId: string,
  ): DeepPartial<OptionEntity>[] {
    return options.map((option) => ({
      optionText: option.optionText,
      isCorrect: option.isCorrect,
      optionImageId: option.optionImageId,
      slide: { id: slideId } as DeepPartial<SlideEntity>,
    }));
  }
}
