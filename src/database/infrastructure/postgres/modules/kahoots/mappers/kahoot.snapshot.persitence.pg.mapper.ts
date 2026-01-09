// src/kahoots/infrastructure/persistence/postgres/mappers/kahoot.persistence.pg.mapper.ts

import { DeepPartial } from 'typeorm';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';
import { KahootEntity } from '../../../entities/kahoot/kahoot.entity.pg';
import { SlideEntity } from '../../../entities/kahoot/slide.entitity.pg';
import { OptionEntity } from '../../../entities/kahoot/option.entity.pg';

export class KahootPersistencePgMapper implements IMapper<KahootSnapshot, DeepPartial<KahootEntity>> {

  public map(snapshot: KahootSnapshot): DeepPartial<KahootEntity> {
    const { styling, details, slides, ...rest } = snapshot;

    return {
      ...rest,
      themeId: styling.themeId,
      coverImageId: styling.imageId ?? undefined,
      
      title: details?.title ?? undefined,
      description: details?.description ?? undefined,
      category: details?.category ?? undefined,

      slides: slides ? this.mapSlidesToPersistence(slides, snapshot.id) : [],
    };
  }

  private mapSlidesToPersistence(slides: any[], kahootId: string): DeepPartial<SlideEntity>[] {
    return slides.map((slide) => ({
      id: slide.id,
      position: slide.position,
      slideType: slide.slideType,
      timeLimitSeconds: slide.timeLimitSeconds,
      questionText: slide.questionText ?? undefined,
      slideImageId: slide.slideImageId ?? undefined,
      pointsValue: slide.pointsValue ?? undefined,
      descriptionText: slide.descriptionText ?? undefined,
      kahoot: { id: kahootId }, 
      options: slide.options ? this.mapOptionsToPersistence(slide.options, slide.id) : [],
    }));
  }

  private mapOptionsToPersistence(options: any[], slideId: string): DeepPartial<OptionEntity>[] {
    return options.map((option) => ({
      optionText: option.optionText ?? undefined,
      isCorrect: option.isCorrect,
      optionImageId: option.optionImageId ?? undefined,
      slide: { id: slideId }
    }));
  }
}