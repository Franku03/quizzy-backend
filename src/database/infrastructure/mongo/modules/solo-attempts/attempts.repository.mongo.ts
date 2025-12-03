import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// Domain Repository Interface
import { SoloAttemptRepository } from 'src/solo-attempts/domain/ports/attempt.repository.port';

// Building blocks required for Aggregate reconstruction
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

// Infrastructure Entity (Schema)
import { AttemptMongo } from '../../entities/attempts.scheme';
import { AttemptStatus } from 'src/solo-attempts/domain/value-objects/attempt.status';

@Injectable()
export class SoloAttemptRepositoryMongo implements SoloAttemptRepository {
  constructor(
    @InjectModel(AttemptMongo.name)
    private readonly attemptModel: Model<AttemptMongo>,
  ) {}

  // Finds an existing attempt by its unique business identifier.
  // It is vital to reconstruct the full state before any modification.
  public async findById(attemptId: AttemptId): Promise<Optional<SoloAttempt>> {
    // Query the MongoDB collection for the attempt document.
    // A document that matches the ID is returned, or null if not found.
    const document = await this.attemptModel.findOne({ id: attemptId.value }).exec();

    // If no document is found, return null to indicate absence.
    if (!document) {
      return new Optional<SoloAttempt>();
    }

    // Convert the flat database document into a rich domain aggregate.
    const aggregate = this.mapToDomain(document);
    return new Optional<SoloAttempt>(aggregate);
  }

  // Checks if the player already has an open session for this specific kahoot.
  // The domain only allows one in-progress attempt per user-kahoot pair.
  public async findActiveForUserIdAndKahootId(
    userId: UserId,
    kahootId: KahootId,
  ): Promise<Optional<SoloAttempt>> {
    const document = await this.attemptModel
    // FindOne returns the first document that matches the criteria.
    // In this case, we look for an attempt by the player for the kahoot that is still in progress.
      .findOne({
        playerId: userId.value,
        kahootId: kahootId.value,
        status: AttemptStatusEnum.IN_PROGRESS,
      })
      .exec();

    if (!document) {
      return new Optional<SoloAttempt>();
    }

    const aggregate = this.mapToDomain(document);
    return new Optional<SoloAttempt>(aggregate);
  }

  // Retrieves all attempts that have not been completed by the player.
  public async findAllActiveForUserId(userId: UserId): Promise<SoloAttempt[]> {
    const documents = await this.attemptModel
      // Finds all documents where the player has active attempts.
      .find({
        playerId: userId.value,
        status: AttemptStatusEnum.IN_PROGRESS,
      })
      .exec();

    return documents.map((doc) => this.mapToDomain(doc));
  }

  // Retrieves all attempts that are active for a specific kahoot.
  public async findAllActiveForKahootId(kahootId: KahootId): Promise<SoloAttempt[]> {
    const documents = await this.attemptModel
      // Finds all documents where the player has active attempts.
      .find({
        kahootId: kahootId.value,
        status: AttemptStatusEnum.IN_PROGRESS,
      })
      .exec();

    return documents.map((doc) => this.mapToDomain(doc));
  }

  // Persists attempt changes or creates a new one if it does not exist.
  // We use an atomic operation to ensure data consistency.
  public async save(attempt: SoloAttempt): Promise<void> {
    const persistenceData = this.mapToPersistence(attempt);

    try {
      // Upsert: updates if exists, inserts if new.
      // findOneAndUpdate Explanation: 
      await this.attemptModel
        .findOneAndUpdate({ id: attempt.attemptId.value }, persistenceData, {
          upsert: true,
          new: true,
          runValidators: true,
        })
        .exec();
    } catch (error) {
      // This catch block handles a specific concurrency edge case.
      // Under high load, two requests (A and B) might check for the ID 
      // simultaneously and both find that the document does not exist.
      
      // Request A wins the race and inserts the document first.
      // Request B then attempts to insert the document, violating the unique
      // index on the 'id' field, which causes the E11000 error.
      
      if (error.code === 11000 && error.keyPattern?.id) {
        throw new Error(
          `Concurrency Error: Attempt with ID ${attempt.attemptId.value} was just created by another process.`,
        );
      }
      throw error;  
    }
  }

  // Physically removes the attempt from the database.
  // Used when restarting a game or cleaning obsolete data after kahoot changes.
  public async delete(attemptId: AttemptId): Promise<void> {
    await this.attemptModel.deleteOne({ id: attemptId.value }).exec();
  }
  

  // Deletes all active attempts for a specific kahoot in a single operation.
  // cleanup operations when a kahoot is modified or deleted. 
  // (Active attempts for that kahoot must be discarded.)
  public async deleteAllActiveForKahootId(kahootId: KahootId): Promise<number> {
    // We use deleteMany to remove all matching documents in a single database operation.
    // This is atomic and more performant than individual delete operations.
    const result = await this.attemptModel
      .deleteMany({
        kahootId: kahootId.value,
        status: AttemptStatusEnum.IN_PROGRESS,
      })
      .exec();

    // Return the number of documents that were deleted.
    // This allows the caller to know how many attempts were cleaned up.
    return result.deletedCount;
  }


  // Transforms the domain aggregate into a flat structure for MongoDB.
  // Here we flatten the complexity of Value Objects to optimize storage.
  private mapToPersistence(attempt: SoloAttempt): any {

    // We flatten the list of player answers.
    const flattenedAnswers = attempt.answers.map((ans) => {
      // We unpack the answer content and its type discriminator.
      const flattenedContent = ans.answerContent.map((content) => {
        return {
          isCorrect: content.isCorrect,
          answerContent: {
            _type: content.hasImage() ? 'IMAGE' : 'TEXT',
            value: content.getAnswerContent(),
          },
        };
      });

      return {
        slideId: ans.slideId.value,
        slidePosition: ans.SlidePosition,
        answerIndex: ans.answerIndex,
        isAnswerCorrect: ans.isCorrect(),
        // Simple numeric Value Objects are stored as primitives.
        earnedScore: ans.earnedScore.getScore(),
        timeElapsed: ans.timeElapsed.toSeconds(),
        answerContent: flattenedContent,
        // We save an exact copy of the question as it was answered.
        questionSnapshot: {
          questionText: ans.questionSnapshot.questionText,
          basePoints: ans.questionSnapshot.basePoints.value,
          timeLimit: ans.questionSnapshot.timeLimit.value,
        },
      };
    });

    return {
      id: attempt.attemptId.value,
      kahootId: attempt.kahootId.value,
      playerId: attempt.playerId.value,
      status: attempt.status.getEnum(),
      totalScore: attempt.totalScore.getScore(),
      progress: {
        totalQuestions: attempt.progress.totalQuestions,
        questionsAnswered: attempt.progress.questionsAnswered,
      },
      timeDetails: {
        startedAt: attempt.timeDetails.startedAt,
        lastPlayedAt: attempt.timeDetails.lastPlayedAt,
        // We handle the optional: if it has no value, we explicitly store null.
        completedAt: attempt.timeDetails.completedAt.hasValue()
          ? attempt.timeDetails.completedAt.getValue()
          : null,
      },
      answers: flattenedAnswers,
    };
  }

  // Reconstructs the full aggregate from flat MongoDB data.
  // Restores the semantic richness and behavior of Value Objects.
  private mapToDomain(doc: AttemptMongo): SoloAttempt {
    const mappedAnswers = doc.answers.map((ans) => {
      // We use domain factories to reconstruct the correct type (Image/Text).
      const reconstructedContent = ans.answerContent.map((content) => {
        if (content.answerContent._type === 'IMAGE') {
          return AnswerSelected.createFromImageIdString(
            content.answerContent.value,
            content.isCorrect,
          );
        } else {
          return AnswerSelected.createFromText(
            content.answerContent.value,
            content.isCorrect,
          );
        }
      });

      // We restore the question snapshot with its correct data types.
      const questionSnapshot = QuestionSnapshot.create(
        ans.questionSnapshot.questionText,
        new Points(ans.questionSnapshot.basePoints),
        new TimeLimitSeconds(ans.questionSnapshot.timeLimit),
      );

      // Finally, we instantiate the PlayerAnswer Value Object.
      return new PlayerAnswer({
        slideId: new SlideId(ans.slideId),
        SlidePosition: ans.slidePosition,
        answerIndex: ans.answerIndex,
        isAnswerCorrect: ans.isAnswerCorrect,
        earnedScore: Score.create(ans.earnedScore),
        timeElapsed: ResponseTime.fromSeconds(ans.timeElapsed),
        answerContent: reconstructedContent,
        questionSnapshot: questionSnapshot,
      });
    });

    // We reconstruct time details handling the possible nullity of the end date.
    const timeDetails = new AttemptTimeDetails({
      startedAt: doc.timeDetails.startedAt,
      lastPlayedAt: doc.timeDetails.lastPlayedAt,
      completedAt: doc.timeDetails.completedAt
        ? new Optional<Date>(doc.timeDetails.completedAt)
        : new Optional<Date>(),
    });

    // The aggregate is instantiated cleanly with all its Value Objects.
    return new SoloAttempt({
      id: new AttemptId(doc.id),
      kahootId: new KahootId(doc.kahootId),
      playerId: new UserId(doc.playerId),
      totalScore: Score.create(doc.totalScore),
      status: new AttemptStatus({ status: doc.status }),
      progress: AttemptProgress.create(
        doc.progress.totalQuestions,
        doc.progress.questionsAnswered,
      ),
      timeDetails: timeDetails,
      answers: mappedAnswers,
    });
  }
}