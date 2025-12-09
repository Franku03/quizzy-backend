import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { StartSoloAttemptCommand } from './start-attempt.command';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';
import type { EventBus } from 'src/core/domain/ports/event-bus.port';

// Domain Imports
import { SoloAttempt } from 'src/solo-attempts/domain/aggregates/attempt';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import type { SoloAttemptRepository } from 'src/solo-attempts/domain/ports/attempt.repository.port';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { SoloAttemptFactory } from 'src/solo-attempts/domain/factories/attempt.factory';
import { SlideSnapshotMapper } from '../mappers/slide.mapper';
import { START_ATTEMPT_ERROR_CODES } from './start-attempt.errors';
import { UuidGenerator } from 'src/core/infrastructure/adapters/idgenerator/uuid-generator';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { AttemptId } from 'src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id';
@CommandHandler(StartSoloAttemptCommand)
export class StartSoloAttemptHandler implements ICommandHandler<StartSoloAttemptCommand> {
  constructor(
    @Inject(RepositoryName.Attempt)
    private readonly attemptRepository: SoloAttemptRepository,
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: EventBus,
    @Inject(UuidGenerator) private readonly uuidGenerator: IdGenerator<string>,
  
  ) {}

  async execute(command: StartSoloAttemptCommand): Promise<any> {
    // We instantiate the Value Objects to ensure structural validity of IDs
    const kahootId = new KahootId(command.kahootId);
    const playerId = new UserId(command.userId);
    
    // We Fetch the Kahoot Aggregate to ensure it exists 
    const kahootOptional = await this.kahootRepository.findKahootById(kahootId);
    if (!kahootOptional.hasValue()) {
      throw new Error(START_ATTEMPT_ERROR_CODES.KAHOOT_NOT_FOUND);
    }
    const kahoot = kahootOptional.getValue();

    // We must verify if the Kahoot is playable. Drafts cannot be played.
    if (kahoot.isDraft()){
      throw new Error(START_ATTEMPT_ERROR_CODES.DRAFT_KAHOOT);
    }

    // Before creating a new attempt, we check if there's already an active
    // attempt for this user and Kahoot. This prevents duplicate active attempts.
    const existingAttempt = await this.attemptRepository.findActiveForUserIdAndKahootId(
      playerId,
      kahootId
    );

    if (existingAttempt.hasValue()) {
      // If an active attempt exists, it is rewritten (deleted) to allow a fresh start.
      await this.attemptRepository.delete(existingAttempt.getValue().attemptId);
    }

    // We need the total number of slides to initialize the progress tracker correctly.
    const totalQuestions = kahoot.hasHowManySlides();

    // We use the Attempt Factory to create a clean, new instance of the SoloAttempt Aggregate.
    // This encapsulates the creation logic and ensures all initial invariants are met.
    // We generate a new unique AttemptId for this game session.
    const attemptIdString = await this.uuidGenerator.generateId();
    const attemptId = new AttemptId(attemptIdString);
    const attempt = SoloAttemptFactory.createNewAttempt(
      attemptId,
      playerId,
      kahootId,
      totalQuestions,
    );

    // We notify the domain that the attempt has started. 
    // (This launches a Domain Event internally)
    attempt.notifyStart();

    // We persist the new attempt into the database.
    await this.attemptRepository.save(attempt);

    // We extract any Domain Events generated during creation/start (AttemptStarted)
    // and publish them to the Event Bus so other contexts can react (like Analytics).
    const events = attempt.pullDomainEvents();
    if (events.length > 0) {
      await this.eventBus.publish(events);
    }

    // We retrieve the snapshot of the first slide to send it back to the client immediately.
    // Passing -1 or no argument instructs the method to fetch the first index (0).
    const firstSlideSnapshot = kahoot.getNextSlideSnapshotByIndex();

    if (!firstSlideSnapshot) {
      throw new Error(START_ATTEMPT_ERROR_CODES.NO_SLIDES);
    }
    
    // We construct the output object matching the output response requirement.
    const outputSlide = SlideSnapshotMapper.toOutputSlide(firstSlideSnapshot);

    return {
      attemptId: attempt.attemptId.value,
      firstSlide: outputSlide
    };
  }
}