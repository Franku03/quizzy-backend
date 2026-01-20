/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\mappers\kahoot.response.mapper.ts

import { Injectable } from '@nestjs/common';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { KahootHandlerResponseDto } from '../dtos/kahoot.handler.response.dto';
import { SlideHandlerResponseDto } from '../dtos/kahoot.slide.handler.response.dto';
import { OptionHandlerResponseDto } from '../dtos/kahoot.slide.option.handler.response.dto';
import { SlideSnapshot } from 'src/core/domain/snapshots/snapshot.slide';
import { OptionSnapshot } from 'src/core/domain/snapshots/snapshot.option';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';

@Injectable()
export class KahootMapperService implements IMapper<
  KahootSnapshot,
  KahootHandlerResponseDto
> {
  public map(snapshot: KahootSnapshot): KahootHandlerResponseDto {
    const response = new KahootHandlerResponseDto();
    const { details, styling } = snapshot;

    // Mapeo básico con lógica de formato interna
    response.id = snapshot.id;
    response.authorId = snapshot.authorId;
    response.createdAt = snapshot.createdAt;
    response.playCount = snapshot.playCount;

    // Se usa ?? '' para cumplir con @typescript-eslint/prefer-nullish-coalescing
    response.status = this.capitalize(snapshot.status) ?? '';
    response.visibility = this.capitalize(snapshot.visibility) ?? '';

    response.theme = styling.theme ?? null;
    response.coverImageId = styling.imageId ?? null;

    // Detalles
    response.title = details?.title ?? null;
    response.description = details?.description ?? null;
    response.category = details?.category ?? null;

    // Slides
    response.questions = this.mapSlides(snapshot.slides);

    return response;
  }

  private capitalize(value: string | null): string | null {
    if (typeof value !== 'string' || !value.trim()) {
      return null;
    }
    const trimmed = value.trim().toLowerCase();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  private mapSlides(
    slides: SlideSnapshot[] | null,
  ): SlideHandlerResponseDto[] | null {
    if (!slides || slides.length === 0) return null;

    return slides.map((slide): SlideHandlerResponseDto => {
      const slideResponse = new SlideHandlerResponseDto();
      slideResponse.id = slide.id;
      slideResponse.text = slide.questionText ?? null;
      slideResponse.mediaId = slide.slideImageId ?? null;
      slideResponse.type = slide.slideType.toLowerCase();
      slideResponse.timeLimit = slide.timeLimitSeconds;
      slideResponse.points = slide.pointsValue ?? null;
      slideResponse.position = slide.position;
      slideResponse.answers = this.mapOptions(slide.options);

      return slideResponse;
    });
  }

  private mapOptions(
    options?: OptionSnapshot[] | null,
  ): OptionHandlerResponseDto[] | null {
    if (!options || options.length === 0) return null;

    return options.map((opt, index): OptionHandlerResponseDto => {
      const optionResponse = new OptionHandlerResponseDto();
      optionResponse.id = index.toString();
      optionResponse.text = opt.optionText ?? null;
      optionResponse.mediaId = opt.optionImageId ?? null;
      optionResponse.isCorrect = opt.isCorrect;

      return optionResponse;
    });
  }
}
