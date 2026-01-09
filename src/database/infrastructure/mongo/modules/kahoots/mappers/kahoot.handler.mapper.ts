// src/kahoots/infrastructure/persistence/mongo/mappers/kahoot-read.mapper.ts
import { 
  IKahootDocument, 
  SlideSnapshot, 
  OptionSnapshot 
} from '../../../entities/kahoots.schema';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { SlideTypeEnum } from 'src/kahoots/domain/value-objects/kahoot.slide.type';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';


export class KahootReadMapper implements IMapper<IKahootDocument, KahootSnapshot> {

  // ==========================================
  // IMPLEMENTACIÓN DE IMapper
  // ==========================================

  /**
   * Transforma un documento de MongoDB (IKahootDocument) en un Snapshot de dominio.
   */
  public map(document: IKahootDocument): KahootSnapshot {
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

      // Usamos el helper privado con el tipado correcto de tu Schema
      slides: document.slides ? this.mapSlidesData(document.slides) : [],
    });
  }

  // ==========================================
  // MÉTODOS PRIVADOS DE APOYO
  // ==========================================

  /**
   * Mapea el array de slides usando la clase SlideSnapshot del esquema.
   */
  private mapSlidesData(slides: SlideSnapshot[]): any[] {
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

  /**
   * Mapea las opciones usando la clase OptionSnapshot del esquema.
   */
  private mapOptionsData(options: OptionSnapshot[] | null | undefined): any[] {
    if (!options || options.length === 0) return [];

    return options.map((option) => ({
      optionText: option.optionText ?? undefined,
      isCorrect: option.isCorrect,
      optionImageId: option.optionImageId ?? undefined
    }));
  }
}