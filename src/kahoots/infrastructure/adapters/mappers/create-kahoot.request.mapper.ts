/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\infrastructure\adapters\mappers\create-kahoot.request.mapper.ts

import { Injectable } from '@nestjs/common';
import { CreateKahootCommand } from 'src/kahoots/application/commands';
import { CreateKahootDTO } from 'src/kahoots/infrastructure/dtos';
import { BaseKahootRequestMapper } from './base-kahoot.request.mapper';

export interface CreateKahootInput {
  dto: CreateKahootDTO;
  userId: string;
}

@Injectable()
export class CreateKahootRequestMapper extends BaseKahootRequestMapper<
  CreateKahootInput,
  CreateKahootCommand
> {
  public map(input: CreateKahootInput): CreateKahootCommand {
    const { dto, userId } = input;

    return new CreateKahootCommand({
      ...dto,
      slides: this.mapSlides(dto.questions),
      imageId: dto.coverImageId,
      userId,
    });
  }
}
