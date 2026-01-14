/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\infrastructure\adapters\mappers\update-kahoot.request.mapper.ts

import { Injectable } from '@nestjs/common';
import { UpdateKahootCommand } from 'src/kahoots/application/commands';
import { UpdateKahootDTO } from 'src/kahoots/infrastructure/dtos';
import { BaseKahootRequestMapper } from './base-kahoot.request.mapper';

export interface ReplaceKahootInput {
  dto: UpdateKahootDTO;
  id: string;
  userId: string;
}

@Injectable()
export class UpdateKahootRequestMapper extends BaseKahootRequestMapper<
  ReplaceKahootInput,
  UpdateKahootCommand
> {
  public map(input: ReplaceKahootInput): UpdateKahootCommand {
    const { dto, id, userId } = input;

    return new UpdateKahootCommand({
      ...dto,
      slides: this.mapSlides(dto.questions),
      imageId: dto.coverImageId,
      id,
      userId,
    });
  }
}
