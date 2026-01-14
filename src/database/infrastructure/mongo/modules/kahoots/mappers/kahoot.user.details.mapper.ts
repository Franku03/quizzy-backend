/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\modules\kahoots\mappers\kahoot.user.details.mapper.ts

import { IKahootDocument } from '../../../entities/kahoots.schema';
import { UserMongo } from '../../../entities/users.schema';
import { AttemptMongo } from '../../../entities/attempts.scheme';
import { AttemptStatusEnum } from 'src/solo-attempts/domain/value-objects/attempt.status.enum';
import { KahootUserDetailReadModel } from 'src/kahoots/application/dtos/kahoot-user-detail.read.model.dto';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';

export interface KahootUserDetailInput {
  readonly kahoot: IKahootDocument;
  readonly user: UserMongo | null;
  readonly lastAttempt: AttemptMongo | null;
}

export class KahootUserDetailMapper implements IMapper<
  KahootUserDetailInput,
  KahootUserDetailReadModel
> {
  public map(input: KahootUserDetailInput): KahootUserDetailReadModel {
    const { kahoot, user, lastAttempt } = input;

    const details = kahoot.details ?? {
      title: null,
      description: null,
      category: null,
    };
    const styling = kahoot.styling;

    const isInProgress = lastAttempt?.status === AttemptStatusEnum.IN_PROGRESS;
    const isCompleted = lastAttempt?.status === AttemptStatusEnum.COMPLETED;
    const isFavorite = user?.favoriteKahoots.includes(kahoot.id) ?? false;

    return new KahootUserDetailReadModel(
      kahoot.id,
      details.title,
      details.description,
      styling.imageId ?? null,
      kahoot.visibility,
      styling.themeId,
      {
        id: kahoot.authorId,
        name: user?.username ?? 'Usuario Desconocido',
      },
      kahoot.createdAt,
      kahoot.playCount,
      details.category,
      kahoot.status,
      isInProgress,
      isCompleted,
      isFavorite,
      lastAttempt
        ? {
            attemptId: lastAttempt.id,
            currentScore: lastAttempt.totalScore,
            currentSlide: lastAttempt.progress.questionsAnswered,
            totalSlides: lastAttempt.progress.totalQuestions,
            lastPlayedAt: lastAttempt.timeDetails.lastPlayedAt,
          }
        : null,
    );
  }
}
