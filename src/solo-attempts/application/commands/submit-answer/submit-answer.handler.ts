// src/singleplayer/application/commands/submit-answer/submit-answer.handler.ts

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SubmitAnswerCommand } from './submit-answer.command';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';
import type { EventBus } from 'src/core/domain/ports/event-bus.port';

// Domain Imports
import { AttemptId } from 'src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { SlideId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.slide.id';
import { ResponseTime } from 'src/core/domain/shared-value-objects/value-objects/value.object.response-time';
import type { SoloAttemptRepository } from 'src/solo-attempts/domain/ports/attempt.repository.port';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { SoloAttemptEvaluationService } from 'src/solo-attempts/domain/domain-services/evaluation.service';
import { OutputSlide, SlideSnapshotMapper } from '../mappers/slide.mapper';
import { SUBMIT_ANSWER_ERROR_CODES } from './submit-answer.errors';

// Application Layer Mapper
import { SubmissionMapper } from '../mappers/submission.mapper';

@CommandHandler(SubmitAnswerCommand)
export class SubmitAnswerHandler implements ICommandHandler<SubmitAnswerCommand> {
  
  private readonly evaluationService: SoloAttemptEvaluationService;

  constructor(
    @Inject(RepositoryName.Attempt)
    private readonly attemptRepository: SoloAttemptRepository,
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: EventBus,
  ) {
    this.evaluationService = new SoloAttemptEvaluationService();
  }

  async execute(command: SubmitAnswerCommand): Promise<any> {
    // We instantiate Value Objects from the command data
    // This validates the structure of the input at the domain level
    const attemptId = new AttemptId(command.attemptId);
    // User module is not finalized yet so we won't use the userId given by the command
    //const userId = new UserId(command.userId);
    const slideId = new SlideId(command.slideId);
    const responseTime = ResponseTime.fromSeconds(command.timeElapsedSeconds);

    // We fetch the SoloAttempt Aggregate to ensure it exists
    const attemptOptional = await this.attemptRepository.findById(attemptId);
    if (!attemptOptional.hasValue()) {
      throw new Error(`${SUBMIT_ANSWER_ERROR_CODES.ATTEMPT_NOT_FOUND}: Attempt ${attemptId.value} not found`);
    }
    const attempt = attemptOptional.getValue();

    // We must verify that the attempt belongs to the authenticated user
    /* User module is not finalized yet so these checks are disabled for now
    if (!attempt.playerId.equals(userId)) {
      throw new Error(
        `${SUBMIT_ANSWER_ERROR_CODES.UNAUTHORIZED_ATTEMPT_ACCESS}: User ${userId.value} does not own attempt ${attemptId.value}`
      );
    }*/

    // Temporary workaround: we assign the fetched attempt's playerId as the userId
    const userId = attempt.playerId;

    // We check if the attempt is in progress to avoid unnecessary Kahoot loading
    // This validation is done in the aggregate method as well, but we do it early here
    // to prevent loading the Kahoot aggregate if the attempt is already finished.
    // Having the validation inside the aggregate is still necessary to maintain domain integrity.
    if (!attempt.isInProgress()) {
      throw new Error(
        `${SUBMIT_ANSWER_ERROR_CODES.ATTEMPT_NOT_IN_PROGRESS}: Attempt ${attemptId.value} is not in progress`
      );
    }

    // We load the Kahoot Aggregate using the kahootId from the attempt
    const kahootOptional = await this.kahootRepository.findKahootById(attempt.kahootId);
    if (!kahootOptional.hasValue()) {
      throw new Error(
        `${SUBMIT_ANSWER_ERROR_CODES.KAHOOT_NOT_FOUND}: Kahoot ${attempt.kahootId.value} not found`
      );
    }
    const kahoot = kahootOptional.getValue();

    // We use the application layer mapper to create a Submission value object 
    // from the player's response data provided in the command
    const submission = SubmissionMapper.fromPlayerResponse(
      slideId,
      command.answerIndex,
      responseTime
    );

    // We use the domain service to evaluate the submission
    // This service orchestrates the interaction between Kahoot and Attempt aggregates
    // Both aggregates will check their own invariants regarding the submission.
    // The Attempt aggregate will also update its internal state based on the evaluation outcome.
    // The service also checks cross-aggregate invariants like slide correspodence and kahoot-attempt linkage
    // It returns a Result encapsulating the evaluation outcome
    const result = this.evaluationService.evaluate(kahoot, attempt, submission);

    // If no errors were thrown, we proceed to persist the updated attempt state
    await this.attemptRepository.save(attempt);

    // After persisting, we extract any Domain Events generated during evaluation
    const events = attempt.pullDomainEvents();
    if (events.length > 0) {
      await this.eventBus.publish(events);
    }

    // Now, we get the next slide snapshot, which we neeed to give to the player to continue the game
    const nextSlideSnapshot = kahoot.getNextSlideSnapshotById(slideId);

    // If there's a next slide, we map it to the output format
    // By giving them the next slide right away, we enable smoother transitions
    // If there is no next slide, we set it to null indicating the end of the Kahoot
    // In that case, completion logic was already handled within the Attempt aggregate during evaluation
    // Including event dispatching for side-effects. So no need for further action here.
    // Client will know the game finished because of the attempt state (in response) will change to completed, 
    // and therefore can react accordingly.
    let nextSlide: OutputSlide | null;
    if (nextSlideSnapshot) {
        nextSlide = SlideSnapshotMapper.toOutputSlide(nextSlideSnapshot);
    }
    else {
        nextSlide = null;
    }

    // We construct the response matching the API specification for H5.3
    return {
      wasCorrect: result.isCorrect(),
      pointsEarned: result.getScoreValue(),
      updatedScore: attempt.totalScore.getScore(),
      attemptState: attempt.status.getEnum(),
      nextSlide: nextSlide
    };
  }
}