// src/kahoots/infrastructure/persistence/mongo/mappers/kahoot-read.mapper.ts
import { Injectable } from '@nestjs/common';
import { KahootMongo } from '../../../entities/kahoots.schema';

// Importamos los Snapshots
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { SlideSnapshot } from 'src/core/domain/snapshots/snapshot.slide';
import { OptionSnapshot } from 'src/core/domain/snapshots/snapshot.option';
import { SlideTypeEnum } from 'src/kahoots/domain/value-objects/kahoot.slide.type';

@Injectable()
export class KahootReadMapper {

  mapDocumentToSnapshot(document: KahootMongo): KahootSnapshot {
    return {
      id: document.id,
      authorId: document.authorId,
      
      // TRUCO 1: new Date() acepta string (lo que TS cree que es) 
      // y acepta Date (lo que es en realidad). Luego convertimos a ISO.
      createdAt: new Date(document.createdAt).toISOString(),
      
      status: document.status,
      visibility: document.visibility,
      playCount: document.playCount ?? 0,

      // TRUCO 2: Usar '?? undefined' transforma el null de Mongo en el undefined del Snapshot
      details: document.details ? {
        title: document.details.title ?? undefined,
        description: document.details.description ?? undefined,
        category: document.details.category ?? undefined,
      } : undefined,

      styling: {
        themeId: document.styling.themeId,
        imageId: document.styling.imageId ?? undefined,
        // Aquí asignamos undefined explícitamente porque tu Snapshot lo espera opcional
        theme: undefined 
      },

      slides: document.slides ? this.mapSlides(document.slides) : [],

    };
  }

  private mapSlides(slides: any[]): SlideSnapshot[] {
    // Nota: Aquí 'slides' viene como any[] o SlideSnapshot[] desde el documento.
    // Al iterar, TypeScript infiere los tipos basándose en la definición de Mongoose.
    return slides.map((slide) => ({
      id: slide.id,
      position: slide.position,
      // Validación de Enum: Asumimos que la BD tiene el valor correcto.
      // Si quieres evitar 'as', podrías usar una función de guarda, 
      // pero aquí TypeScript debería aceptar string si el Enum es de strings.
      slideType: slide.slideType as SlideTypeEnum, 
      timeLimitSeconds: slide.timeLimitSeconds,
      
      questionText: slide.questionText ?? undefined,
      slideImageId: slide.slideImageId ?? undefined,
      pointsValue: slide.pointsValue ?? undefined,
      descriptionText: slide.descriptionText ?? undefined,
      
      options: this.mapOptions(slide.options)
    }));
  }

  private mapOptions(options: any[] | null | undefined): OptionSnapshot[] {
    if (!options || options.length === 0) return [];

    return options.map((option) => ({
      optionText: option.optionText ?? undefined,
      isCorrect: option.isCorrect,
      optionImageId: option.optionImageId ?? undefined
    }));
  }
}