// src/singleplayer/application/mappers/slide-snapshot.mapper.ts

import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";

export interface FrontendOption {
  index: string;
  text: string | null;
  mediaID: string | null;
}

export interface FrontendSlide {
  slideId: string;
  questionType: string;
  questionText: string | null;
  timeLimitSeconds: number;
  options: FrontendOption[];
}

// Este mapper transforma un SlideSnapshot del dominio a la estructura
// esperada por el frontend, removiendo información sensible como isCorrect
// y agregando los índices basados en 1.
export class SlideSnapshotMapper {
  static toFrontendSlide(snapshot: SlideSnapshot): FrontendSlide {
    return {
      slideId: snapshot.id,
      questionType: snapshot.slideType,
      questionText: snapshot.questionText || null,
      timeLimitSeconds: snapshot.timeLimitSeconds,
      options: snapshot.options?.map((option, index) => ({
        index: index.toString(), // Convertir a string y basado en 1
        text: option.optionText || null,
        mediaID: option.optionImageId || null
        // Importante: No exponer isCorrect al frontend
      })) || []
    };
  }
}