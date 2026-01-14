/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\kahoots\mappers\kahoot.snapshot.pg.mapper.ts

import { KahootEntity } from '../../../entities/kahoot/kahoot.entity.pg';
import { SlideEntity } from '../../../entities/kahoot/slide.entitity.pg';
import { OptionEntity } from '../../../entities/kahoot/option.entity.pg';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { OptionSnapshot } from 'src/core/domain/snapshots/snapshot.option';
import { SlideSnapshot } from 'src/core/domain/snapshots/snapshot.slide';
import { SlideTypeEnum } from 'src/kahoots/domain/value-objects/kahoot.slide.type';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';

export class KahootSnapshotPgMapper implements IMapper<
  KahootEntity,
  KahootSnapshot
> {
  public map(entity: KahootEntity): KahootSnapshot {
    return KahootSnapshot.fromRaw({
      id: entity.id,
      authorId: entity.authorId,
      createdAt: entity.createdAt.toISOString(),
      status: entity.status,
      visibility: entity.visibility,
      playCount: entity.playCount,

      details: {
        title: entity.title,
        description: entity.description,
        category: entity.category,
      },

      styling: {
        themeId: entity.themeId,
        imageId: entity.coverImageId,
      },
      slides: this.mapSlides(entity.slides),
    });
  }

  private mapSlides(slides: SlideEntity[]): SlideSnapshot[] {
    return [...slides]
      .sort((a, b) => a.position - b.position)
      .map((slide) =>
        SlideSnapshot.fromRaw({
          id: slide.id,
          position: slide.position,
          slideType: slide.slideType as SlideTypeEnum,
          timeLimitSeconds: slide.timeLimitSeconds,
          questionText: slide.questionText,
          slideImageId: slide.slideImageId,
          pointsValue: slide.pointsValue,
          descriptionText: slide.descriptionText,
          options: this.mapOptions(slide.options),
        }),
      );
  }

  private mapOptions(options: OptionEntity[]): OptionSnapshot[] {
    return options.map((option) =>
      OptionSnapshot.fromRaw({
        optionText: option.optionText,
        isCorrect: option.isCorrect,
        optionImageId: option.optionImageId,
      }),
    );
  }
}
