/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\modules\solo-attempts\attempts.dao.mongo.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AttemptMongo} from '../../entities/attempts.scheme';
import { AttemptStatusEnum } from 'src/solo-attempts/domain/value-objects/attempt.status.enum';
import { KahootMongo } from '../../entities/kahoots.schema';
import { ISoloAttemptQueryDao } from 'src/solo-attempts/application/queries/ports/attempts.dao.port';
import { Optional } from 'src/core/types/optional';
import { AttemptResumeReadModel } from 'src/solo-attempts/application/queries/read-models/resume.attempt.read.model';
import { AttemptSummaryReadModel } from 'src/solo-attempts/application/queries/read-models/summary.attempt.read.model';
import { 
  AttemptReportReadModel, 
  QuestionResultReadModel 
} from 'src/reports/application/queries/read-models/solo.attempt.report.read.model';
import { NextSlideReadModel } from 'src/solo-attempts/application/queries/read-models/resume.attempt.read.model';
import { DaoMongo } from '../../decorators/dao-mongo.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { AttemptInspectReadModel, AttemptGameStateReadModel } from 'src/solo-attempts/application/queries/read-models/inspect.attempt.read.model';


@DaoMongo(DaoName.SoloAttempt)
@Injectable()
export class SoloAttemptQueryDaoMongo implements ISoloAttemptQueryDao {
  // We inject the Mongoose models that represent our persistent aggregates.
  // These provide access to the 'attempts' and 'kahoots' collections.
  constructor(
    @InjectModel(AttemptMongo.name)
    private readonly attemptModel: Model<AttemptMongo>,
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
  ) {}

  
  // Fast lookup of user ID associated with a given attempt. 
  // Used for authorization checks.
  // O(1) speed.
  async getAttemptUserId(attemptId: string): Promise<Optional<string>> {
    // We use a specific projection { playerId: 1 } to strictly fetch only the 
    // ID required for authorization, ignoring the heavy 'answers' array.
    // We use .lean() to bypass Mongoose document hydration, returning a 
    // plain JavaScript object which is significantly faster.
    // Since the prop is defined as @Prop({ unique: true, index: true }), this lookup is O(1).
    const attempt = await this.attemptModel
      .findOne({ id: attemptId })
      .select({ playerId: 1 })
      .lean()
      .exec();

    // If no attempt is found, return an empty Optional
    if (!attempt) {
      return new Optional<string>();
    }

    // Wrap the result in your Optional class
    return new Optional(attempt.playerId);
  }


  async getResumeContext(attemptId: string): Promise<Optional<AttemptResumeReadModel>> {
    // We first need to retrieve the current state of the gameplay attempt.
    const attempt = await this.attemptModel.findOne({ id: attemptId }).exec();

    if (!attempt) return new Optional<AttemptResumeReadModel>();

    // If the player has already finished the game, we return the status immediately
    // without fetching any further slide data.
    if (attempt.status === AttemptStatusEnum.COMPLETED) {
      return new Optional(
        new AttemptResumeReadModel(
          attempt.id,
          attempt.status,
          attempt.totalScore,
          null, // No next slide available for a completed game
        ),
      );
    }

    // Since the game is still in progress, we must identify the next challenge.
    // The 'questionsAnswered' counter tells us the index of the slide pending to be played.
    const nextSlideIndex = attempt.progress.questionsAnswered;

    // We retrieve the specific slide definition from the Kahoot aggregate.
    // We use projection to fetch only the specific slide index to optimize bandwidth.
    const kahoot = await this.kahootModel.findOne(
      { id: attempt.kahootId },
      // When returning this document, only include 1 element from the 
      // slides array, starting at position nextSlideIndex
      { 'slides': { $slice: [nextSlideIndex, 1] } }// Mongo projection for array element
    ).exec();

    // Check if we got any slides back
    if (!kahoot || !kahoot.slides || kahoot.slides.length === 0) {
        return new Optional<AttemptResumeReadModel>();
    }

    // We retrieve the snapshot of the slide to map it to the read model.
    const slideSnapshot = kahoot.slides[0];

    const nextSlideModel = new NextSlideReadModel(
      slideSnapshot.id,
      slideSnapshot.slideImageId || null,
      slideSnapshot.slideType,
      slideSnapshot.questionText || '',
      slideSnapshot.timeLimitSeconds,
      // We map the options for the player view. Crucially, we do NOT include the
      // 'isCorrect' flag here to prevent cheating via API inspection.
      (slideSnapshot.options || []).map((opt: any, index: number) => ({
        index: index, 
        text: opt.optionText || null,
        mediaId: opt.optionImageId || null,
      })),
    );

    return new Optional(
      new AttemptResumeReadModel(
        attempt.id,
        attempt.status,
        attempt.totalScore,
        nextSlideModel,
      ),
    );
  }

  async getPerformanceSummary(attemptId: string): Promise<Optional<AttemptSummaryReadModel>> {
    // We fetch the attempt to calculate the final performance metrics.
    const attempt = await this.attemptModel.findOne({ id: attemptId }).exec();

    if (!attempt) return new Optional<AttemptSummaryReadModel>();

    if (attempt.status !== AttemptStatusEnum.COMPLETED) {
      // The attempt is not yet completed, so we cannot provide a summary.
      return new Optional<AttemptSummaryReadModel>();
    }

    // We need to calculate how many answers were actually correct.
    const totalCorrect = attempt.answers.filter((a) => a.isAnswerCorrect).length;

    // To prevent division by zero errors in edge cases (e.g., empty games),
    // we default the total questions to 1 for the percentage calculation if needed.
    const safeTotal = attempt.progress.totalQuestions || 1;
    
    // We compute the accuracy percentage rounded to the nearest integer.
    const accuracy = Math.round((totalCorrect / safeTotal) * 100);

    return new Optional(
      new AttemptSummaryReadModel(
        attempt.id,
        attempt.totalScore,
        totalCorrect,
        attempt.progress.totalQuestions,
        accuracy,
      ),
    );
  }

  async getDetailedReport(attemptId: string): Promise<Optional<AttemptReportReadModel>> {
    // We need the full attempt history to construct the detailed report.
    const attempt = await this.attemptModel.findOne({ id: attemptId }).exec();

    if (!attempt) return new Optional<AttemptReportReadModel>();

    if (attempt.status !== AttemptStatusEnum.COMPLETED) {
      // The attempt is not yet completed, so we cannot provide a summary.
      return new Optional<AttemptReportReadModel>();
    }
    
    const kahoot = await this.kahootModel
      .findOne({ id: attempt.kahootId }, { 'details.title': 1 })
      .exec();

    // We transform the flat list of answers into detailed question results.
    const questionResults = attempt.answers.map((ans, index) => {
      // We extract text and image values into separate arrays as required by the API.
      const textAnswers = ans.answerContent
        .filter((c) => c.answerContent._type === 'TEXT')
        .map((c) => c.answerContent.value);

      const mediaAnswers = ans.answerContent
        .filter((c) => c.answerContent._type === 'IMAGE')
        .map((c) => c.answerContent.value);

      return new QuestionResultReadModel(
        ans.slidePosition,
        ans.questionSnapshot.questionText,
        ans.isAnswerCorrect,
        textAnswers,
        mediaAnswers,
        ans.timeElapsed,
      );
    });

    // We calculate the average response time across all answered questions.
    const totalTime = attempt.answers.reduce((acc, curr) => acc + curr.timeElapsed, 0);
    const avgTime =
      attempt.answers.length > 0 ? Math.round(totalTime / attempt.answers.length) : 0;
    
    // We recalculate the correct answers count for the summary section of the report.
    const correctCount = attempt.answers.filter((a) => a.isAnswerCorrect).length;

    // We use optional chaining '?.' in case 'details' itself is null.
    const kahootTitle = kahoot?.details?.title || 'Unknown Kahoot';

    return new Optional(
      new AttemptReportReadModel(
        attempt.kahootId,
        kahootTitle,
        attempt.playerId,
        attempt.totalScore,
        correctCount,
        attempt.progress.totalQuestions,
        avgTime,
        questionResults,
      ),
    );
  }


  async inspectAttempt(kahootId: string, userId: string): Promise<Optional<AttemptInspectReadModel>> {
    // Priority 1: Check for an IN_PROGRESS attempt.
    // We use findOne to get the first encountered match.
    let attempt = await this.attemptModel.findOne({
      playerId: userId,
      kahootId: kahootId,
      status: AttemptStatusEnum.IN_PROGRESS,
    }).exec();

    if (attempt) {
      const gameState = new AttemptGameStateReadModel(
        attempt.id,
        attempt.totalScore,
        attempt.progress.questionsAnswered,
        attempt.progress.totalQuestions,
        attempt.timeDetails.lastPlayedAt,
      );
      
      return new Optional(
        new AttemptInspectReadModel(true, false, gameState)
      );
    }

    // Priority 2: If no active game, check for a COMPLETED attempt.
    attempt = await this.attemptModel.findOne({
      playerId: userId,
      kahootId: kahootId,
      status: AttemptStatusEnum.COMPLETED,
    }).exec();

    if (attempt) {
      const gameState = new AttemptGameStateReadModel(
        attempt.id,
        attempt.totalScore,
        attempt.progress.questionsAnswered,
        attempt.progress.totalQuestions,
        attempt.timeDetails.lastPlayedAt,
      );

      return new Optional(
        new AttemptInspectReadModel(false, true, gameState)
      );
    }

    // Fallback: No attempt found (neither in-progress nor completed).
    // Return model with all flags false and no game state.
    return new Optional(
      new AttemptInspectReadModel(false, false, null)
    );
  }
}