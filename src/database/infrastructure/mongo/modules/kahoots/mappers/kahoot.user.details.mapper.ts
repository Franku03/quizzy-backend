//src\database\infrastructure\mongo\modules\kahoots\mappers
import { IKahootDocument } from '../../../entities/kahoots.schema';
import { UserMongo } from '../../../entities/users.schema';
import { AttemptMongo } from '../../../entities/attempts.scheme';
import { AttemptStatusEnum } from 'src/solo-attempts/domain/value-objects/attempt.status.enum';
import { KahootUserDetailReadModel } from 'src/kahoots/application/dtos/kahoot-user-detail.read.model.dto';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';


export type KahootUserDetailInput = {
  readonly kahoot: IKahootDocument;
  readonly user: UserMongo | null;
  readonly lastAttempt: AttemptMongo | null;
};

export class KahootUserDetailMapper implements IMapper<KahootUserDetailInput, KahootUserDetailReadModel> {
  
  public map(input: KahootUserDetailInput): KahootUserDetailReadModel {
    const { kahoot, user, lastAttempt } = input;
    
    const isInProgress = lastAttempt?.status === AttemptStatusEnum.IN_PROGRESS;
    const isCompleted = lastAttempt?.status === AttemptStatusEnum.COMPLETED;
    const isFavorite = user?.favoriteKahoots?.includes(kahoot.id) ?? false;

    return new KahootUserDetailReadModel(
      kahoot.id,
      kahoot.details?.title ?? null,
      kahoot.details?.description ?? null,
      kahoot.styling?.imageId ?? null,
      kahoot.visibility,
      kahoot.styling.themeId,
      { 
        id: kahoot.authorId, 
        name: user?.username ?? 'Usuario Desconocido' 
      },
      kahoot.createdAt,
      kahoot.playCount,
      kahoot.details?.category ?? null,
      kahoot.status,
      isInProgress,
      isCompleted,
      isFavorite,
      lastAttempt ? {
        attemptId: lastAttempt.id,
        currentScore: lastAttempt.totalScore,
        currentSlide: lastAttempt.progress.questionsAnswered,
        totalSlides: lastAttempt.progress.totalQuestions,
        lastPlayedAt: lastAttempt.timeDetails.lastPlayedAt,
      } : null
    );
  }
}