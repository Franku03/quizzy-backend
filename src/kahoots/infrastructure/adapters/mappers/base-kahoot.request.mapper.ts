/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\infrastructure\adapters\mappers\base-kahoot.request.mapper.ts

import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';
import { OptionInputDTO, SlideInputDTO } from 'src/kahoots/infrastructure/dtos';
import {
  KahootOptionCommand,
  KahootSlideCommand,
} from 'src/kahoots/application/commands';

export abstract class BaseKahootRequestMapper<I, O> implements IMapper<I, O> {
  public abstract map(input: I): O;

  protected mapOptions(
    optionsInput?: OptionInputDTO[],
  ): KahootOptionCommand[] | undefined {
    return optionsInput?.map(
      (opt) =>
        new KahootOptionCommand({
          text: opt.text ?? '',
          isCorrect: opt.isCorrect,
          optionImage: opt.mediaId,
        }),
    );
  }

  protected mapSlides(
    slidesInput?: SlideInputDTO[],
  ): KahootSlideCommand[] | undefined {
    return slidesInput?.map((slide, index) => {
      const { answers, type, timeLimit, text, mediaId, points, ...rest } =
        slide;
      return new KahootSlideCommand({
        ...rest,
        slideType: type,
        timeLimit,
        question: text,
        slideImage: mediaId,
        points,
        description: '',
        position: index,
        options: this.mapOptions(answers),
      });
    });
  }
}
