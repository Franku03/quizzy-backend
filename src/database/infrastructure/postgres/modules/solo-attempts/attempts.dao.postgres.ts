/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\solo-attempts\attempts.dao.postgres.ts

import { Injectable } from '@nestjs/common';
import { AttemptStatusEnum } from 'src/solo-attempts/domain/value-objects/attempt.status.enum';
import { ISoloAttemptQueryDao } from 'src/solo-attempts/application/queries/ports/attempts.dao.port';
import { Optional } from 'src/core/types/optional';
import { AttemptResumeReadModel } from 'src/solo-attempts/application/queries/read-models/resume.attempt.read.model';
import { AttemptSummaryReadModel } from 'src/solo-attempts/application/queries/read-models/summary.attempt.read.model';
import { 
  AttemptReportReadModel, 
  QuestionResultReadModel 
} from 'src/reports/application/queries/read-models/solo.attempt.report.read.model';
import { NextSlideReadModel } from 'src/solo-attempts/application/queries/read-models/resume.attempt.read.model';
import { AttemptInspectReadModel, AttemptGameStateReadModel } from 'src/solo-attempts/application/queries/read-models/inspect.attempt.read.model';
import { DaoPostgres } from '../../decorators/dao-postgres.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { Repository } from 'typeorm';
import { PlayerAnswerContentEntity } from '../../entities/attempt/player-answer-content.entity.pg';
import { PlayerAnswerEntity } from '../../entities/attempt/player-answer.entity.pg';
import { AttemptEntity } from '../../entities/attempt/attempt.entity.pg';
import { InjectRepository } from '@nestjs/typeorm';
import { KahootEntity } from '../../entities/kahoot/kahoot.entity.pg';
import { OptionEntity } from '../../entities/kahoot/option.entity.pg';
import { SlideEntity } from '../../entities/kahoot/slide.entitity.pg';

@DaoPostgres(DaoName.SoloAttempt)
@Injectable()
export class SoloAttemptQueryDaoPostgres implements ISoloAttemptQueryDao {
  // We inject the postgres entities needed.
  // These provide access to the 'attempts' and 'kahoots' collections.
  constructor(
    @InjectRepository(KahootEntity)
    private readonly kahootRepo: Repository<KahootEntity>,
    @InjectRepository(OptionEntity)
    private readonly optionRepo: Repository<OptionEntity>,
    @InjectRepository(SlideEntity)
    private readonly slideRepo: Repository<SlideEntity>,
    @InjectRepository(AttemptEntity)
    private readonly attemptRepo: Repository<AttemptEntity>,
    @InjectRepository(PlayerAnswerEntity)
    private readonly playerAnswerRepo: Repository<PlayerAnswerEntity>,
    @InjectRepository(PlayerAnswerContentEntity)
    private readonly answerContentRepo: Repository<PlayerAnswerContentEntity>,
  ) {}
  
  // Fast lookup of user ID associated with a given attempt. 
  // Used for authorization checks.
  // O(1) speed.
  async getAttemptUserId(attemptId: string): Promise<Optional<string>> {
    // We use TypeORM's findOne method with a select clause to fetch only the 
    // playerId column. This is equivalent to MongoDB's projection and ensures
    // we don't load the entire entity with its relationships, which would be 
    // heavy for a simple authorization check.
    // The 'id' field is the primary key with an index, making this lookup O(1).
    const attempt = await this.attemptRepo.findOne({
        where: { id: attemptId },
        select: ['playerId'], // Only fetch the playerId column, ignore all others
    });

    // If no attempt is found, return an empty Optional
    if (!attempt) {
        return new Optional<string>();
    }

    // Wrap the result in your Optional class
    return new Optional(attempt.playerId);
  }



  async getResumeContext(attemptId: string): Promise<Optional<AttemptResumeReadModel>> {
    // We start by retrieving the attempt from the database using its unique ID.
    const attempt = await this.attemptRepo.findOne({
      where: { id: attemptId },
    });

    // If the attempt doesn't exist, we return an empty Optional.
    if (!attempt) {
      return new Optional<AttemptResumeReadModel>();
    }

    // For completed attempts, we return just the status and score without
    // fetching slide data. This is more efficient.
    if (attempt.status === AttemptStatusEnum.COMPLETED) {
      return new Optional(
        new AttemptResumeReadModel(
          attempt.id,
          attempt.status,
          attempt.totalScore,
          null,
        ),
      );
    }

    // For in-progress attempts, we need to get the next slide.
    // The questionsAnswered field tells us which position to look for.
    const nextSlidePosition = attempt.questionsAnswered;

    // We fetch the slide at the specific position for this kahoot.
    // We include the options relation to get all the choices.
    const slide = await this.slideRepo.findOne({
      where: { 
        kahootId: attempt.kahootId,
        position: nextSlidePosition
      },
      relations: ['options'],
    });

    // If no slide is found at the expected position, we can't resume.
    if (!slide) {
      return new Optional<AttemptResumeReadModel>();
    }

    // We map the options exactly as they come from the database.
    // The database should return them in a consistent order if the
    // underlying data hasn't been modified.
    const mappedOptions = slide.options.map((option, index) => ({
      index: index, // Use the array index as the option index
      text: option.optionText || null,
      mediaId: option.optionImageId || null,
    }));

    // Create the next slide model with all the details needed for gameplay.
    const nextSlideModel = new NextSlideReadModel(
      slide.id,
      slide.slideImageId || null,
      slide.slideType,
      slide.questionText || '',
      slide.timeLimitSeconds,
      mappedOptions,
    );

    // Return the complete resume context ready for the player.
    return new Optional(
      new AttemptResumeReadModel(
        attempt.id,
        attempt.status,
        attempt.totalScore,
        nextSlideModel,
      ),
    );
  }

  // Calculates the quick statistics shown immediately after finishing a game.
  // This method relies on the 'correctAnswersCount' and 'totalQuestions' fields
  // that are maintained in the AttemptEntity during gameplay.
  async getPerformanceSummary(attemptId: string): Promise<Optional<AttemptSummaryReadModel>> {
    // First, we retrieve the attempt from the database using its unique identifier.
    // We use findOne with a simple WHERE clause since we only need the attempt's
    // aggregated statistics, not its relationships (answers, etc.).
    const attempt = await this.attemptRepo.findOne({
      where: { id: attemptId },
    });

    // If no attempt is found with the given ID, we return an empty Optional.
    // This could happen if the attempt was deleted or the ID is invalid.
    if (!attempt) {
      return new Optional<AttemptSummaryReadModel>();
    }

    // Performance summaries are only meaningful for completed attempts.
    // If the attempt is still in progress, we cannot provide final statistics.
    if (attempt.status !== AttemptStatusEnum.COMPLETED) {
      return new Optional<AttemptSummaryReadModel>();
    }

    // We use the pre-calculated 'correctAnswersCount' field for efficiency.
    // This field is maintained by the application logic during gameplay,
    // so we don't need to query and count through all the answer records.
    const totalCorrect = attempt.correctAnswersCount;

    // To avoid division by zero in edge cases (e.g., empty games or data issues),
    // we use a safe denominator for the percentage calculation.
    const safeTotal = attempt.totalQuestions || 1;

    // We calculate the accuracy percentage by dividing correct answers by total questions,
    // then multiplying by 100 and rounding to the nearest integer.
    const accuracy = Math.round((totalCorrect / safeTotal) * 100);

    // We return a summary model containing all the performance metrics
    // that will be displayed to the player after completing the game.
    return new Optional(
      new AttemptSummaryReadModel(
        attempt.id,
        attempt.totalScore,
        totalCorrect,
        attempt.totalQuestions,
        accuracy,
      ),
    );
  }

  // Reconstructs the full timeline of the game for a detailed report view.
// This requires fetching the attempt along with all its related answers and
// answer contents, then joining with the Kahoot entity to get the game title.
async getDetailedReport(attemptId: string): Promise<Optional<AttemptReportReadModel>> {
  // First, we need to fetch the complete attempt with all its relationships.
  // We use TypeORM's findOne with relations to load the nested answer structure
  // in a single query, which is more efficient than multiple separate queries.
  const attempt = await this.attemptRepo.findOne({
    where: { id: attemptId },
    relations: [
      'answers',                    // Load all player answers for this attempt
      'answers.answerContents'     // Load all content (text/image) for each answer
    ],
    // We specify ordering to ensure answers come in the order they were given
    // during the game, which is important for the timeline reconstruction.
    order: {
      answers: {
        slidePosition: 'ASC'       // Order answers by their slide position
      }
    }
  });

  // If no attempt is found with the given ID, we return an empty Optional.
  // This could happen if the attempt was deleted or the ID is invalid.
  if (!attempt) {
    return new Optional<AttemptReportReadModel>();
  }

  // Detailed reports are only meaningful for completed attempts.
  // If the attempt is still in progress, we cannot provide a final report.
  if (attempt.status !== AttemptStatusEnum.COMPLETED) {
    return new Optional<AttemptReportReadModel>();
  }

  // We need the kahoot title for the report header.
  // We fetch only the title column to minimize data transfer.
  const kahoot = await this.kahootRepo.findOne({
    where: { id: attempt.kahootId },
    select: ['title']  // Only fetch the title, ignore all other columns
  });

  // We transform each player answer into a detailed question result model.
  // This involves extracting the text and image values from the answer contents.
  const questionResults = attempt.answers.map((answer) => {
    // We separate text answers from media answers based on their content type.
    // In PostgreSQL, this is stored as a discriminator column (contentType).
    const textAnswers = answer.answerContents
      .filter((content) => content.contentType === 'TEXT')
      .map((content) => content.value);

    const mediaAnswers = answer.answerContents
      .filter((content) => content.contentType === 'IMAGE')
      .map((content) => content.value);

    // Create a question result model for each answered slide.
    // Note: The PlayerAnswerEntity already stores the question snapshot text
    // from when the question was answered, preserving historical accuracy.
    return new QuestionResultReadModel(
      answer.slidePosition,
      answer.snapshotQuestionText,
      answer.isAnswerCorrect,
      textAnswers,
      mediaAnswers,
      answer.timeElapsed,
    );
  });

  // Calculate the average response time across all answered questions.
  // We sum up all time elapsed values and divide by the number of answers.
  const totalTime = attempt.answers.reduce((acc, answer) => acc + answer.timeElapsed, 0);
  const avgTime = attempt.answers.length > 0 
    ? Math.round(totalTime / attempt.answers.length) 
    : 0;

  // For the report summary, we need to count how many answers were correct.
  // Since the attempt entity maintains a correctAnswersCount field that's
  // updated during gameplay, we can use that directly for efficiency.
  const correctCount = attempt.correctAnswersCount;

  // We use optional chaining in case the kahoot record was deleted or the
  // title field is null, providing a fallback title for the report.
  const kahootTitle = kahoot?.title || 'Unknown Kahoot';

  // Return the complete detailed report model with all game timeline data
  // and performance metrics, ready for display to the player.
  return new Optional(
    new AttemptReportReadModel(
      attempt.kahootId,
      kahootTitle,
      attempt.playerId,
      attempt.totalScore,
      correctCount,
      attempt.totalQuestions,
      avgTime,
      questionResults,
    ),
  );
}


  // The inspectAttempt method checks the engagement status of a user with a specific Kahoot.
  // It first looks for any active (IN_PROGRESS) attempts, and if none are found, it falls back
  // to the first completed attempt. This method is typically called from the kahoot inspect handler
  // to determine if a user can resume, view results, or start fresh.
  async inspectAttempt(kahootId: string, userId: string): Promise<Optional<AttemptInspectReadModel>> {
    // We start by querying for an IN_PROGRESS attempt, which has the highest priority.
    // TypeORM's findOne method will return the first matching record based on our criteria.
    // We use the indexed fields (playerId, kahootId, status) for optimal query performance.
    // The index 'idx_attempts_player_kahoot_status' ensures this lookup is efficient.
    let attempt = await this.attemptRepo.findOne({
      where: {
        playerId: userId,
        kahootId: kahootId,
        status: AttemptStatusEnum.IN_PROGRESS,
      },
    });

    // If we find an active attempt, we construct a game state model from it.
    // The AttemptGameStateReadModel contains all the information needed to display
    // the current progress to the user, including score, slide position, and last play time.
    if (attempt) {
      const gameState = new AttemptGameStateReadModel(
        attempt.id,
        attempt.totalScore,
        attempt.questionsAnswered, // This represents the current slide index (0-based)
        attempt.totalQuestions,    // Total slides in the kahoot
        attempt.lastPlayedAt,      // When the user last interacted with this attempt
      );
      
      // We return a model indicating that this is an active (in-progress) attempt.
      // The flags are set to (isInProgress: true, isCompleted: false) as per the interface.
      return new Optional(
        new AttemptInspectReadModel(true, false, gameState)
      );
    }

    // If no active attempt exists, we look for a COMPLETED attempt as a fallback.
    // Users should be able to view their results even after finishing a game.
    // The same indexed fields are used for performance, and we query for COMPLETED status.
    attempt = await this.attemptRepo.findOne({
      where: {
        playerId: userId,
        kahootId: kahootId,
        status: AttemptStatusEnum.COMPLETED,
      },
    });

    // If we find a completed attempt, we construct the game state model similarly.
    // For completed attempts, the questionsAnswered should equal totalQuestions,
    // indicating the user has answered all slides in the kahoot.
    if (attempt) {
      const gameState = new AttemptGameStateReadModel(
        attempt.id,
        attempt.totalScore,
        attempt.questionsAnswered, // This should equal totalQuestions for completed attempts
        attempt.totalQuestions,
        attempt.lastPlayedAt,      // This would be the completion time for finished attempts
      );

      // We return a model indicating that this is a completed attempt.
      // The flags are set to (isInProgress: false, isCompleted: true).
      return new Optional(
        new AttemptInspectReadModel(false, true, gameState)
      );
    }

    // If we reach this point, no attempt was found (neither in-progress nor completed).
    // This means the user has not yet engaged with this kahoot, or all attempts were deleted.
    // We return a model with both flags set to false and no game state, indicating a fresh start.
    return new Optional(
      new AttemptInspectReadModel(false, false, null)
    );
  }
}