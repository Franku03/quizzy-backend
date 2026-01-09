// src/kahoots/infrastructure/persistence/postgres/mappers/kahoot.snapshot.pg.mapper.ts
import { KahootEntity } from '../../../entities/kahoot/kahoot.entity.pg';
import { SlideEntity } from '../../../entities/kahoot/slide.entitity.pg';
import { OptionEntity } from '../../../entities/kahoot/option.entity.pg';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { SlideTypeEnum } from 'src/kahoots/domain/value-objects/kahoot.slide.type';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';

export class KahootSnapshotPgMapper implements IMapper<KahootEntity, KahootSnapshot> {

  /**
   * Transforma una KahootEntity (Postgres) en un KahootSnapshot (Dominio).
   */
  public map(entity: KahootEntity): KahootSnapshot {
    return KahootSnapshot.fromRaw({
      id: entity.id,
      authorId: entity.authorId,
      createdAt: entity.createdAt.toISOString(),
      status: entity.status,
      visibility: entity.visibility,
      playCount: entity.playCount ?? 0,

      // Re-agrupamos las columnas planas de la tabla en el objeto de Snapshot
      details: {
        title: entity.title ?? undefined,
        description: entity.description ?? undefined,
        category: entity.category ?? undefined,
      },

      styling: {
        themeId: entity.themeId,
        imageId: entity.coverImageId ?? undefined,
      },

      // Mapeamos las relaciones OneToMany (Tablas relacionadas)
      slides: entity.slides ? this.mapSlides(entity.slides) : [],
    });
  }

  /**
   * Mapea las SlideEntities de la tabla 'slides'
   */
  private mapSlides(slides: SlideEntity[]): any[] {
    // IMPORTANTE: En SQL el orden no está garantizado, ordenamos por posición
    return slides
      .sort((a, b) => a.position - b.position)
      .map((slide) => ({
        id: slide.id,
        position: slide.position,
        slideType: slide.slideType as SlideTypeEnum,
        timeLimitSeconds: slide.timeLimitSeconds,
        questionText: slide.questionText ?? undefined,
        slideImageId: slide.slideImageId ?? undefined,
        pointsValue: slide.pointsValue ?? undefined,
        descriptionText: slide.descriptionText ?? undefined,
        options: slide.options ? this.mapOptions(slide.options) : [],
      }));
  }

  /**
   * Mapea las OptionEntities de la tabla 'options'
   */
  private mapOptions(options: OptionEntity[]): any[] {
    return options.map((option) => ({
      optionText: option.optionText ?? undefined,
      isCorrect: option.isCorrect,
      optionImageId: option.optionImageId ?? undefined,
    }));
  }
}