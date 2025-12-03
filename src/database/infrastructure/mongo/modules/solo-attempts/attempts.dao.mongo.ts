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
} from 'src/solo-attempts/application/queries/read-models/report.attempt.read.model';
import { NextSlideReadModel } from 'src/solo-attempts/application/queries/read-models/resume.attempt.read.model';

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

    // FIX: Updated projection to target the nested 'details.title' field.
    // The previous '{ title: 1 }' would fail because title is no longer at root.
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
}