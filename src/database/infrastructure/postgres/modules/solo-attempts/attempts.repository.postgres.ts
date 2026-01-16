/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\solo-attempts\attempts.repository.postgres.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AttemptEntity } from '../../entities/attempt/attempt.entity.pg';
import { PlayerAnswerEntity } from '../../entities/attempt/player-answer.entity.pg';
import { PlayerAnswerContentEntity } from '../../entities/attempt/player-answer-content.entity.pg';
import { SoloAttemptRepository } from 'src/solo-attempts/domain/ports/attempt.repository.port';
import { RepositoryPostgres } from '../../decorators/repository-postgres.registry';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

// Domain Aggregate and Value Objects
import { SoloAttempt } from 'src/solo-attempts/domain/aggregates/attempt';
import { AttemptId } from 'src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { Score } from 'src/core/domain/shared-value-objects/value-objects/value.object.score';
import { AttemptProgress } from 'src/solo-attempts/domain/value-objects/attempt.progress';
import { AttemptTimeDetails } from 'src/solo-attempts/domain/value-objects/attempt.time-details';
import { PlayerAnswer } from 'src/solo-attempts/domain/value-objects/attempt.player-answer';
import { QuestionSnapshot } from 'src/core/domain/shared-value-objects/value-objects/value.object.question-snapshot';
import { ResponseTime } from 'src/core/domain/shared-value-objects/value-objects/value.object.response-time';
import { AnswerSelected } from 'src/core/domain/shared-value-objects/value-objects/value.object.answer-selected';
import { Points } from 'src/core/domain/shared-value-objects/value-objects/value.object.points';
import { TimeLimitSeconds } from 'src/core/domain/shared-value-objects/value-objects/value.object.time-limit-seconds';
import { SlideId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.slide.id';
import { Optional } from 'src/core/types/optional';
import { AttemptStatusEnum } from 'src/solo-attempts/domain/value-objects/attempt.status.enum';
import { AttemptStatus } from 'src/solo-attempts/domain/value-objects/attempt.status';

@RepositoryPostgres(RepositoryName.Attempt)
@Injectable()
export class SoloAttemptRepositoryPostgres implements SoloAttemptRepository {
  constructor(
    @InjectRepository(AttemptEntity)
    private readonly attemptRepo: Repository<AttemptEntity>,
    @InjectRepository(PlayerAnswerEntity)
    private readonly playerAnswerRepo: Repository<PlayerAnswerEntity>,
    @InjectRepository(PlayerAnswerContentEntity)
    private readonly answerContentRepo: Repository<PlayerAnswerContentEntity>,
  ) {}

  // Finds a solo attempt by its unique identifier from the PostgreSQL database.
  // This method loads the full aggregate with all its relationships to reconstruct
  // the complete domain state for business operations.
  public async findById(attemptId: AttemptId): Promise<Optional<SoloAttempt>> {
    // We use TypeORM's findOne method with relations to load the complete aggregate.
    // The 'relations' option ensures we fetch the nested player answers and their contents.
    // Without this eager loading, we would only get the main attempt entity.
    const attemptEntity = await this.attemptRepo.findOne({
        where: { id: attemptId.value },
        relations: ['answers', 'answers.answerContents']
    });

    // If no entity is found in the database, we return an empty Optional.
    // This follows the repository pattern of returning null/empty rather than throwing.
    if (!attemptEntity) {
        return new Optional<SoloAttempt>();
    }

    // Convert the database entity into the rich domain aggregate.
    // This reconstruction process preserves all domain behavior and invariants.
    const aggregate = this.mapToDomain(attemptEntity);
    return new Optional<SoloAttempt>(aggregate);
  }


  // Finds an active (in-progress) attempt for a specific user and kahoot combination.
  // This supports the "resume vs start new" business rule where only one active
  // attempt is allowed per user per kahoot. The query uses the composite index
  // for optimal performance when checking for existing attempts.
  public async findActiveForUserIdAndKahootId(
    userId: UserId,
    kahootId: KahootId,
  ): Promise<Optional<SoloAttempt>> {
    // We query for a single attempt with the specific user, kahoot, and IN_PROGRESS status.
    // The composite index on (playerId, kahootId, status) makes this lookup efficient.
    const attemptEntity = await this.attemptRepo.findOne({
      where: {
        playerId: userId.value,
        kahootId: kahootId.value,
        status: AttemptStatusEnum.IN_PROGRESS,
      },
      // We must load the complete aggregate structure including nested answers and their content.
      // Without these relations, we cannot properly reconstruct the domain aggregate.
      relations: ['answers', 'answers.answerContents'],
    });

    // If no active attempt exists for this user-kahoot combination, return empty Optional.
    // This indicates the user can start a new attempt without needing to delete an existing one.
    if (!attemptEntity) {
      return new Optional<SoloAttempt>();
    }

    // Transform the database entity into the full domain aggregate with all business logic.
    const aggregate = this.mapToDomain(attemptEntity);
    return new Optional<SoloAttempt>(aggregate);
  }

  // Retrieves all active (in-progress) attempts for a specific user.
  // This is useful for showing users a list of games they can resume.
  // The query uses the index on (playerId, status) for optimal performance.
  public async findAllActiveForUserId(userId: UserId): Promise<SoloAttempt[]> {
    // Find all attempt entities where the player has active attempts.
    // We filter by status to only get attempts that haven't been completed or abandoned.
    const attemptEntities = await this.attemptRepo.find({
      where: {
        playerId: userId.value,
        status: AttemptStatusEnum.IN_PROGRESS,
      },
      // We need to load the complete aggregate structure for each attempt.
      // This includes all answers and their content to properly reconstruct each domain aggregate.
      relations: ['answers', 'answers.answerContents'],
      // Optional: add ordering to show most recently played attempts first.
      order: { lastPlayedAt: 'DESC' },
    });

    // Map each database entity to its corresponding domain aggregate.
    // This preserves all domain behavior and invariants for each attempt.
    return attemptEntities.map((entity) => this.mapToDomain(entity));
  }

  // Retrieves all active (in-progress) attempts for a specific kahoot.
  // This is primarily used for cleanup operations when a kahoot is modified,
  // ensuring no one continues playing an outdated version of the kahoot.
  // The query uses the index on (kahootId, status) for optimal performance.
  public async findAllActiveForKahootId(kahootId: KahootId): Promise<SoloAttempt[]> {
    // Find all attempt entities for the given kahoot that are still in progress.
    // This allows the application layer to clean up stale attempts after kahoot updates.
    const attemptEntities = await this.attemptRepo.find({
      where: {
        kahootId: kahootId.value,
        status: AttemptStatusEnum.IN_PROGRESS,
      },
      // Load the complete aggregate structure for proper domain reconstruction.
      // Without these relations, we'd have incomplete aggregates missing answer data.
      relations: ['answers', 'answers.answerContents'],
    });

    // Transform each database entity into a fully functional domain aggregate.
    // Each aggregate maintains its business logic and validation rules.
    return attemptEntities.map((entity) => this.mapToDomain(entity));
  }

    public async save(attempt: SoloAttempt): Promise<void> {
    // Use Mongo-style approach: Delete and reinsert
    const queryRunner = this.attemptRepo.manager.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // 1. Delete existing records (cascade will handle child tables)
      await queryRunner.manager.delete(AttemptEntity, { id: attempt.attemptId.value });
      
      // 2. Create fresh entity
      const attemptEntity = new AttemptEntity();
      
      // Set all scalar fields
      attemptEntity.id = attempt.attemptId.value;
      attemptEntity.kahootId = attempt.kahootId.value;
      attemptEntity.playerId = attempt.playerId.value;
      attemptEntity.status = attempt.status.getEnum();
      attemptEntity.totalScore = attempt.totalScore.getScore();
      
      // Calculate correct answers
      const correctAnswers = attempt.answers.filter(answer => answer.isCorrect());
      attemptEntity.correctAnswersCount = correctAnswers.length;
      
      // Set progress
      attemptEntity.totalQuestions = attempt.progress.totalQuestions;
      attemptEntity.questionsAnswered = attempt.progress.questionsAnswered;
      
      // Set time details
      attemptEntity.startedAt = attempt.timeDetails.startedAt;
      attemptEntity.lastPlayedAt = attempt.timeDetails.lastPlayedAt;
      attemptEntity.completedAt = attempt.timeDetails.completedAt.hasValue() 
        ? attempt.timeDetails.completedAt.getValue() 
        : null;
      
      // Create answers array
      attemptEntity.answers = [];
      
      // For each answer, create entity with contents
      for (const answer of attempt.answers) {
        const playerAnswerEntity = new PlayerAnswerEntity();
        
        // Set answer properties
        playerAnswerEntity.slideId = answer.slideId.value;
        playerAnswerEntity.slidePosition = answer.SlidePosition;
        playerAnswerEntity.answerIndex = answer.answerIndex;
        playerAnswerEntity.isAnswerCorrect = answer.isCorrect();
        playerAnswerEntity.earnedScore = answer.earnedScore.getScore();
        playerAnswerEntity.timeElapsed = answer.timeElapsed.toSeconds();
        
        // Set question snapshot
        playerAnswerEntity.snapshotQuestionText = answer.questionSnapshot.questionText;
        playerAnswerEntity.snapshotBasePoints = answer.questionSnapshot.basePoints.value;
        playerAnswerEntity.snapshotTimeLimit = answer.questionSnapshot.timeLimit.value;
        
        // Create answer contents
        playerAnswerEntity.answerContents = [];
        
        for (const content of answer.answerContent) {
          const contentEntity = new PlayerAnswerContentEntity();
          contentEntity.isCorrect = content.isCorrect;
          
          if (content.hasImage()) {
            contentEntity.contentType = 'IMAGE';
            contentEntity.value = content.getAnswerContent();
          } else {
            contentEntity.contentType = 'TEXT';
            contentEntity.value = content.getAnswerContent();
          }
          
          contentEntity.playerAnswer = playerAnswerEntity;
          playerAnswerEntity.answerContents.push(contentEntity);
        }
        
        // Set back-reference
        playerAnswerEntity.attempt = attemptEntity;
        attemptEntity.answers.push(playerAnswerEntity);
      }
      
      // 3. Save the entire graph
      console.log('Saving attempt entity:', attemptEntity);
      await queryRunner.manager.save(attemptEntity);
      
      await queryRunner.commitTransaction();
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to save attempt ${attempt.attemptId.value}: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // Deletes a specific attempt from the database using its unique identifier.
  // This operation also cascades to delete all related player answers and answer
  // contents due to the ON DELETE CASCADE constraint defined in the entity relationships.
  public async delete(attemptId: AttemptId): Promise<void> {
      // We use delete with the attempt ID to remove the record from the attempts table.
      // The cascade configuration ensures that related records in player_answers and
      // player_answer_contents are also deleted, maintaining referential integrity.
      const deleteResult = await this.attemptRepo.delete({ id: attemptId.value });
      
      // Check if any record was actually deleted. While not strictly necessary for
      // the operation to succeed, this provides feedback about whether the attempt existed.
      if (deleteResult.affected === 0) {
          // Log a warning but don't throw an error since delete operations are often
          // idempotent. The caller might not care if the attempt didn't exist.
          console.warn(`Attempt ${attemptId.value} not found for deletion`);
      }
  }

  // Deletes all active (in-progress) attempts for a specific kahoot in a single operation.
  // This is used for cleanup when a kahoot is modified or deleted, ensuring that no one
  // continues playing an outdated version. Returns the number of attempts deleted.
  public async deleteAllActiveForKahootId(kahootId: KahootId): Promise<number> {
      // We use delete with a where clause to target only in-progress attempts for this kahoot.
      // This is more efficient than loading all attempts and deleting them individually.
      const deleteResult = await this.attemptRepo.delete({
          kahootId: kahootId.value,
          status: AttemptStatusEnum.IN_PROGRESS
      });
      
      // Return the count of deleted attempts so the caller knows how many were cleaned up.
      // This is useful for logging, metrics, or determining if any cleanup was needed.
      return deleteResult.affected || 0;
  }

  // Reconstructs the full domain aggregate from PostgreSQL relational data.
  // This method transforms the normalized database structure back into the rich domain model.
  private mapToDomain(attemptEntity: AttemptEntity): SoloAttempt {
    // We start by reconstructing the player answers from the database entities.
    // Each answer contains multiple content items that need to be reconstructed.
    const mappedAnswers = attemptEntity.answers.map((answerEntity) => {
      // For each answer, we need to reconstruct the answer content objects.
      // The content can be either text or image, which is indicated by the contentType field.
      const reconstructedContent = answerEntity.answerContents.map((contentEntity) => {
        // We check the content type to determine which factory method to use.
        // This preserves the polymorphic behavior of the AnswerSelected value object.
        if (contentEntity.contentType === 'IMAGE') {
          return AnswerSelected.createFromImageIdString(
            contentEntity.value,
            contentEntity.isCorrect,
          );
        } else {
          return AnswerSelected.createFromText(
            contentEntity.value,
            contentEntity.isCorrect,
          );
        }
      });

      // We reconstruct the question snapshot as it existed when the player answered.
      // This ensures the historical accuracy of the attempt record.
      const questionSnapshot = QuestionSnapshot.create(
        answerEntity.snapshotQuestionText,
        new Points(answerEntity.snapshotBasePoints),
        new TimeLimitSeconds(answerEntity.snapshotTimeLimit),
      );

      // Now we can create the complete PlayerAnswer value object with all its components.
      return new PlayerAnswer({
        slideId: new SlideId(answerEntity.slideId),
        SlidePosition: answerEntity.slidePosition,
        answerIndex: answerEntity.answerIndex,
        isAnswerCorrect: answerEntity.isAnswerCorrect,
        earnedScore: Score.create(answerEntity.earnedScore),
        timeElapsed: ResponseTime.fromSeconds(answerEntity.timeElapsed),
        answerContent: reconstructedContent,
        questionSnapshot: questionSnapshot,
      });
    });

    // We reconstruct the time details, handling the optional completion date.
    // The completedAt field can be null for attempts that are still in progress.
    const timeDetails = new AttemptTimeDetails({
      startedAt: attemptEntity.startedAt,
      lastPlayedAt: attemptEntity.lastPlayedAt,
      completedAt: attemptEntity.completedAt
        ? new Optional<Date>(attemptEntity.completedAt)
        : new Optional<Date>(),
    });

    // Finally, we assemble all the components into the complete SoloAttempt aggregate.
    // This aggregate encapsulates the complete state of a solo attempt with all its behavior.
    return new SoloAttempt({
      id: new AttemptId(attemptEntity.id),
      kahootId: new KahootId(attemptEntity.kahootId),
      playerId: new UserId(attemptEntity.playerId),
      totalScore: Score.create(attemptEntity.totalScore),
      status: new AttemptStatus({ status: attemptEntity.status }),
      progress: AttemptProgress.create(
        attemptEntity.totalQuestions,
        attemptEntity.questionsAnswered,
      ),
      timeDetails: timeDetails,
      answers: mappedAnswers,
    });
  }
}