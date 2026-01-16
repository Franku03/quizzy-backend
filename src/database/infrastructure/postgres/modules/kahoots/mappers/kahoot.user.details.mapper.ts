/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\kahoots\mappers\kahoot.user.details.mapper.ts

import { KahootUserDetailReadModel } from 'src/kahoots/application/dtos/kahoot-user-detail.read.model.dto';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';
import { KahootEntity } from '../../../entities/kahoot/kahoot.entity.pg';
import { UserEntity } from '../../../entities/users.entity';
import { AttemptEntity } from '../../../entities/attempt/attempt.entity.pg';
import { AttemptStatusEnum } from 'src/solo-attempts/domain/value-objects/attempt.status.enum';

export interface KahootUserDetailPgInput {
  readonly kahoot: KahootEntity;
  readonly user: UserEntity | null;
  readonly lastAttempt: AttemptEntity | null;
}

export class KahootUserDetailPgMapper implements IMapper<
  KahootUserDetailPgInput,
  KahootUserDetailReadModel
> {
  public map(input: KahootUserDetailPgInput): KahootUserDetailReadModel {
    const { kahoot, user, lastAttempt } = input;

    const isInProgress = lastAttempt?.status === AttemptStatusEnum.IN_PROGRESS;
    const isCompleted = lastAttempt?.status === AttemptStatusEnum.COMPLETED;
    
    // En Postgres 'favorites' es una columna JSONB (array de strings)
    const isFavorite = user?.favorites?.includes(kahoot.id) ?? false;

    return new KahootUserDetailReadModel(
      kahoot.id,
      kahoot.title,
      kahoot.description,
      kahoot.coverImageId,
      kahoot.visibility,
      kahoot.themeId,
      {
        id: kahoot.authorId,
        name: user?.username ?? 'Usuario Desconocido',
      },
      kahoot.createdAt.toISOString(),
      kahoot.playCount,
      kahoot.category,
      kahoot.status,
      isInProgress,
      isCompleted,
      isFavorite,
      lastAttempt
        ? {
            attemptId: lastAttempt.id,
            currentScore: lastAttempt.totalScore,
            currentSlide: lastAttempt.questionsAnswered,
            totalSlides: lastAttempt.totalQuestions,
            lastPlayedAt: lastAttempt.lastPlayedAt,
          }
        : null,
    );
  }
}